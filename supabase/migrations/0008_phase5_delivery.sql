-- ============================================================
-- ClearPress AI — Phase 5 schema (Delivery)
-- Reference: approved plan at C:\Users\HCI\.claude\plans\i-m-starting-phase-5-kind-seahorse.md
-- Integrity carry-forward from Phase 4:
--   I1 server-side audit writes only;
--   I4 domain + audit writes in one transaction
--      (delivery_sent inserts INSIDE the mark_delivery_sent_* RPCs;
--       Phase 4 left this gap for variant_generated / compliance_checked).
-- Snapshot model:
--   delivery_snapshot jsonb is the immutable point-in-time payload that
--   three loci read (send-delivery, process-scheduled-sends, feedback-load).
--   create_delivery is the only writer; once written, never mutated.
-- ============================================================

-- ------------------------------------------------------------
-- 1. deliveries: snapshot + recommended variant + audit-report link
-- ------------------------------------------------------------
alter table public.deliveries
  add column recommended_variant_id uuid references public.content_variants(id) on delete set null;
alter table public.deliveries
  add column audit_report_id uuid not null references public.audit_reports(id);
alter table public.deliveries
  add column delivery_snapshot jsonb not null;

-- ------------------------------------------------------------
-- 2. scheduled_sends: retry counter
-- ------------------------------------------------------------
alter table public.scheduled_sends
  add column attempts int not null default 0;

-- ------------------------------------------------------------
-- 3. app_config: server-resolved values (Postgres can't read Deno.env)
-- Seeded in T12 via dashboard SQL editor; RLS-enabled with no policy
-- so client code can't read directly. The two reader RPCs are
-- SECURITY DEFINER and bypass RLS.
-- ------------------------------------------------------------
create table public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

-- ------------------------------------------------------------
-- 4. Trigger: deliveries.status -> scheduled_sends.processed sync
-- Defense in depth so the two flags can't drift if a future code
-- path forgets the manual update. Fires on user + system paths.
-- ------------------------------------------------------------
create or replace function public.deliveries_status_sync_scheduled_sends_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('sent', 'failed')
     and old.status is distinct from new.status then
    update public.scheduled_sends
       set processed = true,
           processed_at = now()
     where delivery_id = new.id;
  end if;
  return new;
end;
$$;

create trigger deliveries_status_sync_scheduled_sends
  after update of status on public.deliveries
  for each row
  execute function public.deliveries_status_sync_scheduled_sends_fn();

-- ------------------------------------------------------------
-- 5. Helper: latest audit report for a project, finalized-only
-- ORDER BY desc + LIMIT 1 is the canonical pattern (PG can't max()
-- over a row type cleanly). Returns NULL when the head-of-chain
-- isn't finalized — that includes 'draft' and 'revised' states.
-- ------------------------------------------------------------
create or replace function public._latest_finalized_audit_report(p_project_id uuid)
returns public.audit_reports
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_report public.audit_reports;
begin
  select * into v_report from public.audit_reports
   where project_id = p_project_id
   order by version_major desc, version_minor desc
   limit 1;
  if not found or v_report.status <> 'finalized' then
    return null;
  end if;
  return v_report;
end;
$$;

-- ============================================================
-- 6. RPC: create_delivery
-- ============================================================
-- Sole writer of delivery_snapshot. Builds the immutable payload from
-- live state at create-time; downstream send paths render only from
-- the snapshot (no joins back to mutable content_variants).
--
-- Token generation lives here (gen_random_bytes -> URL-safe base64).
-- _shared/magic-link.ts in the Edge Function does URL formatting + format
-- validation only; never mints.
create or replace function public.create_delivery(
  p_payload jsonb,
  p_scheduled_for timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.projects;
  v_content_item public.content_items;
  v_variant_ids uuid[];
  v_variant_count int;
  v_distinct_count int;
  v_unapproved_count int;
  v_edited_after_approval_count int;
  v_wrong_item_count int;
  v_recommended uuid;
  v_audit_report public.audit_reports;
  v_signature_hash text;
  v_stale_against_audit_count int;
  v_from_name text;
  v_from_email text;
  v_default_bcc jsonb;
  v_reply_to text;
  v_cc jsonb;
  v_bcc_caller jsonb;
  v_bcc_effective jsonb;
  v_warnings jsonb;
  v_snapshot jsonb;
  v_status text;
  v_token text;
  v_delivery_id uuid;
  v_email_regex text := '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  v_attachment_format text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  -- Project gate
  select * into v_project from public.projects
   where id = (p_payload->>'project_id')::uuid for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'project_not_found';
  end if;

  -- Content item gate (must belong to the project)
  select * into v_content_item from public.content_items
   where id = (p_payload->>'content_item_id')::uuid;
  if not found or v_content_item.project_id <> v_project.id then
    raise exception using errcode = 'P0004', message = 'content_item_not_in_project';
  end if;

  -- Variant IDs: parse + count gates
  select array_agg((value)::uuid) into v_variant_ids
    from jsonb_array_elements_text(p_payload->'variant_ids');
  v_variant_count := coalesce(array_length(v_variant_ids, 1), 0);
  if v_variant_count < 1 or v_variant_count > 3 then
    raise exception using errcode = 'P0004', message = 'variant_count_out_of_range';
  end if;
  select count(distinct e) into v_distinct_count from unnest(v_variant_ids) e;
  if v_distinct_count <> v_variant_count then
    raise exception using errcode = 'P0004', message = 'variant_ids_duplicated';
  end if;

  -- Lock the variants so the gate checks see a stable read
  perform 1 from public.content_variants where id = any(v_variant_ids) for update;

  -- Every variant must belong to the declared content_item
  select count(*) into v_wrong_item_count
    from public.content_variants
   where id = any(v_variant_ids)
     and content_item_id <> v_content_item.id;
  if v_wrong_item_count > 0 then
    raise exception using errcode = 'P0004', message = 'variant_not_in_content_item';
  end if;

  -- Every variant must be approved
  select count(*) into v_unapproved_count
    from public.content_variants
   where id = any(v_variant_ids) and internal_approved = false;
  if v_unapproved_count > 0 then
    raise exception using errcode = 'P0004', message = 'variant_not_approved';
  end if;

  -- No post-approval edits
  select count(*) into v_edited_after_approval_count
    from public.content_variants
   where id = any(v_variant_ids)
     and (internal_approved_at is null or updated_at > internal_approved_at);
  if v_edited_after_approval_count > 0 then
    raise exception using errcode = 'P0004', message = 'variant_updated_after_approval';
  end if;

  -- Recommended must be in attached set (nullable)
  v_recommended := nullif(p_payload->>'recommended_variant_id', '')::uuid;
  if v_recommended is not null and not (v_recommended = any(v_variant_ids)) then
    raise exception using errcode = 'P0004', message = 'recommended_not_attached';
  end if;

  -- Audit report gate: latest must be finalized
  v_audit_report := public._latest_finalized_audit_report(v_project.id);
  if v_audit_report.id is null then
    raise exception using errcode = 'P0004', message = 'audit_not_finalized';
  end if;

  -- Audit freshness: no attached variant edited after finalization
  select count(*) into v_stale_against_audit_count
    from public.content_variants
   where id = any(v_variant_ids)
     and updated_at > v_audit_report.finalized_at;
  if v_stale_against_audit_count > 0 then
    raise exception using errcode = 'P0004', message = 'audit_stale_vs_variants';
  end if;

  -- Email format gates
  if (p_payload->>'recipient_email') !~* v_email_regex then
    raise exception using errcode = 'P0004', message = 'recipient_email_invalid';
  end if;
  v_cc := coalesce(p_payload->'cc_emails', '[]'::jsonb);
  v_bcc_caller := coalesce(p_payload->'bcc_emails', '[]'::jsonb);
  if exists (
    select 1 from jsonb_array_elements_text(v_cc) e where e !~* v_email_regex
  ) or exists (
    select 1 from jsonb_array_elements_text(v_bcc_caller) e where e !~* v_email_regex
  ) then
    raise exception using errcode = 'P0004', message = 'cc_or_bcc_email_invalid';
  end if;

  -- Attachment format gate
  v_attachment_format := p_payload->>'attachment_format';
  if v_attachment_format not in ('pdf', 'word', 'both') then
    raise exception using errcode = 'P0004', message = 'invalid_attachment_format';
  end if;

  -- Schedule gate
  if p_scheduled_for is not null and p_scheduled_for <= now() then
    raise exception using errcode = 'P0004', message = 'scheduled_in_past';
  end if;

  -- Server-resolved sender + default BCC (T12 seeds these)
  select value into v_from_name  from public.app_config where key = 'RESEND_FROM_NAME';
  select value into v_from_email from public.app_config where key = 'RESEND_FROM_EMAIL';
  if v_from_name is null or v_from_email is null then
    raise exception using errcode = 'P0004', message = 'app_config_missing';
  end if;
  select value::jsonb into v_default_bcc from public.app_config where key = 'DEFAULT_BCC_EMAILS';
  v_default_bcc := coalesce(v_default_bcc, '[]'::jsonb);

  -- Reply-To = sender's email (TSD §9.1)
  select email into v_reply_to from public.users where id = v_actor;

  -- BCC merge: caller UNION DEFAULT_BCC_EMAILS, distinct, preserves any order
  select coalesce(jsonb_agg(distinct e), '[]'::jsonb) into v_bcc_effective
    from (
      select jsonb_array_elements_text(v_bcc_caller) as e
      union
      select jsonb_array_elements_text(v_default_bcc)
    ) m;

  -- Latest signature for the finalized report (for snapshot)
  select signature_hash into v_signature_hash
    from public.audit_signatures
   where audit_report_id = v_audit_report.id
   order by signed_at desc limit 1;

  v_warnings := coalesce(p_payload->'scheduling_warnings', '[]'::jsonb);

  -- Build the immutable snapshot
  v_snapshot := jsonb_build_object(
    'project', jsonb_build_object(
      'id', v_project.id,
      'name', v_project.name
    ),
    'content_item', jsonb_build_object(
      'id', v_content_item.id,
      'content_sub_type', v_content_item.content_sub_type
    ),
    'variants', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', cv.id,
          'variant_label', cv.variant_label,
          'variant_index', cv.variant_index,
          'body_html', cv.body_html,
          'body_text', cv.body_text,
          'variation_directive', cv.generation_params->>'variation_directive',
          'char_count', cv.char_count
        ) order by cv.variant_index
      ), '[]'::jsonb)
        from public.content_variants cv
       where cv.id = any(v_variant_ids)
    ),
    'recommended_variant_id', v_recommended,
    'audit_report', jsonb_build_object(
      'id', v_audit_report.id,
      'version_major', v_audit_report.version_major,
      'version_minor', v_audit_report.version_minor,
      'finalized_at', v_audit_report.finalized_at,
      'signature_hash', v_signature_hash
    ),
    'sender', jsonb_build_object(
      'from_name', v_from_name,
      'from_email', v_from_email,
      'reply_to_email', v_reply_to,
      'sent_by_email_snapshot', v_reply_to
    ),
    'recipient', jsonb_build_object(
      'email', p_payload->>'recipient_email',
      'name', p_payload->>'recipient_name',
      'cc_emails', v_cc,
      'bcc_emails_effective', v_bcc_effective
    ),
    'scheduling_warnings', v_warnings
  );

  v_status := case when p_scheduled_for is null then 'draft' else 'scheduled' end;

  -- Persist delivery row
  insert into public.deliveries
    (project_id, recipient_email, recipient_name, cc_emails, bcc_emails,
     subject, body_html, body_text, variant_ids_attached, attachment_format,
     recommended_variant_id, audit_report_id, delivery_snapshot, status)
  values
    (v_project.id,
     p_payload->>'recipient_email',
     p_payload->>'recipient_name',
     v_cc,
     v_bcc_effective,
     p_payload->>'subject',
     p_payload->>'body_html',
     p_payload->>'body_text',
     to_jsonb(v_variant_ids),
     v_attachment_format,
     v_recommended,
     v_audit_report.id,
     v_snapshot,
     v_status)
  returning id into v_delivery_id;

  -- Token: gen_random_bytes(32) -> URL-safe base64 (no padding)
  v_token := rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');

  -- Feedback token (30-day expiry; one-shot enforced by Phase 6 feedback-submit)
  insert into public.feedback_tokens
    (token, delivery_id, expires_at)
  values
    (v_token, v_delivery_id, now() + interval '30 days');

  -- Scheduled-send row if scheduled
  if p_scheduled_for is not null then
    insert into public.scheduled_sends (delivery_id, scheduled_for)
    values (v_delivery_id, p_scheduled_for);
  end if;

  return jsonb_build_object(
    'delivery_id', v_delivery_id,
    'token', v_token,
    'delivery_snapshot', v_snapshot,
    'status', v_status,
    'scheduled_for', p_scheduled_for
  );
end;
$$;

grant execute on function public.create_delivery(jsonb, timestamptz) to authenticated;

-- ============================================================
-- 7. RPC: mark_delivery_sent_user
-- ============================================================
-- I4 atomicity: audit event INSERT in same transaction as state update.
-- Auto-transitions the project to 'delivered' on first successful send.
create or replace function public.mark_delivery_sent_user(
  p_delivery_id uuid,
  p_resend_message_id text
) returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_delivery public.deliveries;
  v_was_scheduled boolean;
  v_scheduled_for timestamptz;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_delivery from public.deliveries
   where id = p_delivery_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'delivery_not_found';
  end if;
  if v_delivery.status not in ('draft', 'scheduled') then
    raise exception using errcode = 'P0004', message = 'delivery_not_pending';
  end if;

  v_was_scheduled := v_delivery.status = 'scheduled';
  select scheduled_for into v_scheduled_for
    from public.scheduled_sends where delivery_id = p_delivery_id;

  update public.deliveries
     set status = 'sent',
         sent_at = now(),
         sent_by = v_actor
   where id = p_delivery_id
   returning * into v_delivery;

  -- Project status auto-transition (idempotent)
  update public.projects
     set status = 'delivered'
   where id = v_delivery.project_id
     and status in ('draft', 'in_review');

  select full_name into v_actor_name from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_delivery.project_id, v_delivery.audit_report_id, 'delivery_sent', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'delivery_id', v_delivery.id,
      'resend_message_id', p_resend_message_id,
      'recipient_email', v_delivery.recipient_email,
      'variant_ids_attached', v_delivery.variant_ids_attached,
      'recommended_variant_id', v_delivery.recommended_variant_id,
      'audit_report_id', v_delivery.audit_report_id,
      'attachment_format', v_delivery.attachment_format,
      'was_scheduled', v_was_scheduled,
      'sent_at', v_delivery.sent_at,
      'scheduled_for', v_scheduled_for,
      'scheduling_warnings', v_delivery.delivery_snapshot->'scheduling_warnings'
    )
  );

  return v_delivery;
end;
$$;

grant execute on function public.mark_delivery_sent_user(uuid, text) to authenticated;

-- ============================================================
-- 8. RPC: mark_delivery_sent_system
-- ============================================================
-- Service-role-only counterpart for process-scheduled-sends.
-- actor_type='system', actor_id=null, actor_name_snapshot='process-scheduled-sends'.
create or replace function public.mark_delivery_sent_system(
  p_delivery_id uuid,
  p_resend_message_id text
) returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
  v_was_scheduled boolean;
  v_scheduled_for timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = 'P0004', message = 'not_service_role';
  end if;

  select * into v_delivery from public.deliveries
   where id = p_delivery_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'delivery_not_found';
  end if;
  if v_delivery.status not in ('draft', 'scheduled') then
    raise exception using errcode = 'P0004', message = 'delivery_not_pending';
  end if;

  v_was_scheduled := v_delivery.status = 'scheduled';
  select scheduled_for into v_scheduled_for
    from public.scheduled_sends where delivery_id = p_delivery_id;

  update public.deliveries
     set status = 'sent',
         sent_at = now(),
         sent_by = null
   where id = p_delivery_id
   returning * into v_delivery;

  update public.projects
     set status = 'delivered'
   where id = v_delivery.project_id
     and status in ('draft', 'in_review');

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_delivery.project_id, v_delivery.audit_report_id, 'delivery_sent', 'system', null, 'process-scheduled-sends',
    jsonb_build_object(
      'delivery_id', v_delivery.id,
      'resend_message_id', p_resend_message_id,
      'recipient_email', v_delivery.recipient_email,
      'variant_ids_attached', v_delivery.variant_ids_attached,
      'recommended_variant_id', v_delivery.recommended_variant_id,
      'audit_report_id', v_delivery.audit_report_id,
      'attachment_format', v_delivery.attachment_format,
      'was_scheduled', v_was_scheduled,
      'sent_at', v_delivery.sent_at,
      'scheduled_for', v_scheduled_for,
      'scheduling_warnings', v_delivery.delivery_snapshot->'scheduling_warnings'
    )
  );

  return v_delivery;
end;
$$;

grant execute on function public.mark_delivery_sent_system(uuid, text) to service_role;

-- ============================================================
-- 9. RPC: record_scheduled_attempt_failure
-- ============================================================
-- Transient-failure path. Increments attempts + records error_message;
-- does NOT change delivery status or processed flag. Caller branches
-- on attempts_after — if >=3, follows up with mark_delivery_failed.
create or replace function public.record_scheduled_attempt_failure(
  p_scheduled_send_id uuid,
  p_error_message text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.scheduled_sends;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = 'P0004', message = 'not_service_role';
  end if;

  select * into v_row from public.scheduled_sends
   where id = p_scheduled_send_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'scheduled_send_not_found';
  end if;

  update public.scheduled_sends
     set attempts = attempts + 1,
         error_message = p_error_message
   where id = p_scheduled_send_id
   returning * into v_row;

  return jsonb_build_object('attempts_after', v_row.attempts);
end;
$$;

grant execute on function public.record_scheduled_attempt_failure(uuid, text) to service_role;

-- ============================================================
-- 10. RPC: mark_delivery_failed
-- ============================================================
-- Terminal failure path. Trigger flips scheduled_sends.processed=true.
-- Called by the immediate path on any send/attachment failure; called by
-- the cron worker only after record_scheduled_attempt_failure returns
-- attempts_after >= 3 (or on an idempotency collision, which is a code
-- bug, not a transient).
-- No audit event in v1 (failure is operational); carry-forward to v2 as
-- `delivery_failed` event type with check-constraint widening.
create or replace function public.mark_delivery_failed(
  p_delivery_id uuid,
  p_error_message text
) returns public.deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.deliveries;
begin
  select * into v_delivery from public.deliveries
   where id = p_delivery_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'delivery_not_found';
  end if;
  if v_delivery.status not in ('draft', 'scheduled') then
    raise exception using errcode = 'P0004', message = 'delivery_not_pending';
  end if;

  update public.deliveries
     set status = 'failed'
   where id = p_delivery_id
   returning * into v_delivery;

  -- No-op if no scheduled_sends row (immediate-path failures)
  update public.scheduled_sends
     set error_message = p_error_message
   where delivery_id = p_delivery_id;

  return v_delivery;
end;
$$;

grant execute on function public.mark_delivery_failed(uuid, text) to authenticated, service_role;

-- ============================================================
-- 11. RPC: get_firm_config_public
-- ============================================================
-- Browser-safe sender display values. Returns only the three fields the
-- composer banner needs. Never returns DEFAULT_BCC_EMAILS or API keys.
create or replace function public.get_firm_config_public()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_actor uuid := auth.uid();
  v_from_name text;
  v_from_email text;
  v_reply_to text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select value into v_from_name  from public.app_config where key = 'RESEND_FROM_NAME';
  select value into v_from_email from public.app_config where key = 'RESEND_FROM_EMAIL';
  if v_from_name is null or v_from_email is null then
    raise exception using errcode = 'P0004', message = 'app_config_missing';
  end if;

  select email into v_reply_to from public.users where id = v_actor;

  return jsonb_build_object(
    'from_name', v_from_name,
    'from_email', v_from_email,
    'reply_to_email', v_reply_to
  );
end;
$$;

grant execute on function public.get_firm_config_public() to authenticated;
