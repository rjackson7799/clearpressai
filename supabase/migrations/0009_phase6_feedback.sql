-- ============================================================
-- ClearPress AI — Phase 6 schema (Feedback Loop)
-- Reference: approved plan at
--   C:\Users\HCI\.claude\plans\continue-phase-5-implementation-immutable-yeti.md
-- Reviewer fixes folded in:
--   - XOR over OR on chosen_variant_id/needs_rework
--   - delta_generation_status persisted (not ephemeral)
--   - submit_feedback idempotent on token_already_used
--   - delivery_snapshot returned from submit_feedback (avoids redundant SELECT in feedback-submit)
--   - project_id + audit_report_id for audit events derived via the delivery join
--     (client_feedback has no direct FK to projects, but audit_trail_events.project_id is NOT NULL)
--   - REVOKE ALL + GRANT EXECUTE TO service_role hardening
-- ============================================================

-- ------------------------------------------------------------
-- 1. client_feedback: NULLABLE chosen_variant_id + XOR + delta status
-- ------------------------------------------------------------
alter table public.client_feedback
  alter column chosen_variant_id drop not null;

-- XOR (!=), not OR: an anonymous caller can otherwise send both
-- chosen_variant_id AND needs_rework=true, bypassing the UI invariant.
alter table public.client_feedback
  add constraint client_feedback_chosen_xor_rework
    check ((chosen_variant_id is null) <> needs_rework);

alter table public.client_feedback
  add column delta_generation_status text not null default 'pending'
    check (delta_generation_status in ('pending', 'succeeded', 'failed'));

alter table public.client_feedback
  add column delta_error text;

create index idx_client_feedback_delta_failed
  on public.client_feedback (id)
  where delta_generation_status = 'failed';

-- ============================================================
-- 2. RPC: submit_feedback
-- ============================================================
-- Service-role-only (REVOKE/GRANT at end of file). Idempotent against
-- lost-response retries: a second call with the same token after the first
-- one committed returns {already_submitted: true} + the existing row, not an
-- error and not a duplicate insert.
create or replace function public.submit_feedback(
  p_token text,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_row       public.feedback_tokens;
  v_delivery        public.deliveries;
  v_project         public.projects;
  v_chosen          uuid;
  v_needs_rework    boolean;
  v_free_text       text;
  v_what_worked     text[];
  v_what_improve    text[];
  v_feedback_id     uuid;
  v_existing        public.client_feedback;
  v_token_regex     text := '^[A-Za-z0-9_-]{43}$';
begin
  if p_token !~ v_token_regex then
    raise exception using errcode = 'P0004', message = 'token_format_invalid';
  end if;

  -- Lock the token row to serialize concurrent double-submits
  select * into v_token_row from public.feedback_tokens
   where token = p_token for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'token_not_found';
  end if;

  if v_token_row.expires_at <= now() then
    raise exception using errcode = 'P0004', message = 'token_expired';
  end if;

  select * into v_delivery from public.deliveries where id = v_token_row.delivery_id;
  select * into v_project  from public.projects   where id = v_delivery.project_id;

  -- Idempotent-replay path: a previous submit committed but the client lost
  -- the 200. Return the existing row instead of inserting a duplicate.
  if v_token_row.used_at is not null then
    select * into v_existing from public.client_feedback
     where feedback_token_id = v_token_row.id;
    return jsonb_build_object(
      'feedback_id',       v_existing.id,
      'project_id',        v_delivery.project_id,
      'client_id',         v_project.client_id,
      'delivery_id',       v_delivery.id,
      'delivery_snapshot', v_delivery.delivery_snapshot,
      'already_submitted', true
    );
  end if;

  v_chosen       := nullif(p_payload->>'chosen_variant_id', '')::uuid;
  v_needs_rework := coalesce((p_payload->>'needs_rework')::boolean, false);
  v_free_text    := p_payload->>'free_text_comment';

  -- Mirror the CHECK constraint at the RPC layer so the API returns a
  -- semantic gate name rather than a raw constraint-violation error.
  if (v_chosen is null) = v_needs_rework then
    raise exception using errcode = 'P0004', message = 'chosen_variant_xor_rework_required';
  end if;

  if v_chosen is not null then
    if not exists (
      select 1 from jsonb_array_elements_text(v_delivery.variant_ids_attached) e
       where e::uuid = v_chosen
    ) then
      raise exception using errcode = 'P0004', message = 'chosen_variant_invalid';
    end if;
  end if;

  -- Dedupe chip arrays, preserving first-occurrence order
  select array_agg(value order by first_ord) into v_what_worked
    from (
      select value, min(ord) as first_ord
        from jsonb_array_elements_text(coalesce(p_payload->'what_worked', '[]'::jsonb))
             with ordinality as t(value, ord)
       group by value
    ) m;
  v_what_worked := coalesce(v_what_worked, ARRAY[]::text[]);

  select array_agg(value order by first_ord) into v_what_improve
    from (
      select value, min(ord) as first_ord
        from jsonb_array_elements_text(coalesce(p_payload->'what_could_improve', '[]'::jsonb))
             with ordinality as t(value, ord)
       group by value
    ) m;
  v_what_improve := coalesce(v_what_improve, ARRAY[]::text[]);

  -- First-write path (all in one transaction)
  insert into public.client_feedback
    (feedback_token_id, chosen_variant_id, what_worked, what_could_improve,
     needs_rework, free_text_comment, delta_generation_status)
  values
    (v_token_row.id, v_chosen,
     to_jsonb(v_what_worked), to_jsonb(v_what_improve),
     v_needs_rework, v_free_text, 'pending')
  returning id into v_feedback_id;

  update public.feedback_tokens
     set used_at = now()
   where id = v_token_row.id;

  -- Idempotent project status flip; no-op for other statuses.
  update public.projects
     set status = 'feedback_received'
   where id = v_delivery.project_id
     and status = 'delivered';

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id,
     actor_name_snapshot, details)
  values (
    v_delivery.project_id, v_delivery.audit_report_id, 'feedback_received',
    'system', null, 'feedback-submit',
    jsonb_build_object(
      'feedback_id',       v_feedback_id,
      'delivery_id',       v_delivery.id,
      'chosen_variant_id', v_chosen,
      'needs_rework',      v_needs_rework,
      'submitted_at',      now()
    )
  );

  -- delivery_snapshot in the return shape saves feedback-submit a redundant
  -- SELECT for the downstream Haiku step (variant bodies live in the snapshot).
  return jsonb_build_object(
    'feedback_id',       v_feedback_id,
    'project_id',        v_delivery.project_id,
    'client_id',         v_project.client_id,
    'delivery_id',       v_delivery.id,
    'delivery_snapshot', v_delivery.delivery_snapshot,
    'already_submitted', false
  );
end;
$$;

-- ============================================================
-- 3. RPC: append_voice_guidelines_from_feedback
-- ============================================================
-- Service-role-only. Inserts the LLM-distilled guidelines, flips
-- delta_generation_status to 'succeeded', and emits one voice_updated audit
-- event — all in one transaction.
create or replace function public.append_voice_guidelines_from_feedback(
  p_feedback_id uuid,
  p_guidelines  text[]
) returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id        uuid;
  v_project_id       uuid;
  v_audit_report_id  uuid;
  v_inserted_ids     uuid[];
begin
  -- project_id is derived via the delivery join because client_feedback
  -- has no direct FK to projects and audit_trail_events.project_id is NOT NULL.
  select p.client_id, d.project_id, d.audit_report_id
    into v_client_id, v_project_id, v_audit_report_id
    from public.client_feedback cf
    join public.feedback_tokens ft on ft.id = cf.feedback_token_id
    join public.deliveries     d  on d.id  = ft.delivery_id
    join public.projects       p  on p.id  = d.project_id
   where cf.id = p_feedback_id;
  if not found then
    raise exception using errcode = 'P0004', message = 'feedback_not_found';
  end if;

  with ins as (
    insert into public.brand_voice_guidelines
      (client_id, source_type, source_reference_id, guideline_text)
    select v_client_id, 'client_feedback', p_feedback_id, g
      from unnest(p_guidelines) with ordinality as t(g, ord)
     order by ord
    returning id
  )
  select array_agg(id) into v_inserted_ids from ins;

  update public.client_feedback
     set delta_generation_status = 'succeeded'
   where id = p_feedback_id;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id,
     actor_name_snapshot, details, model_used)
  values (
    v_project_id, v_audit_report_id, 'voice_updated',
    'system', null, 'feedback-submit',
    jsonb_build_object(
      'feedback_id',  p_feedback_id,
      'guideline_ids', to_jsonb(v_inserted_ids),
      'model_used',   'claude-haiku-4-5-20251001',
      'count',        coalesce(cardinality(v_inserted_ids), 0)
    ),
    'claude-haiku-4-5-20251001'
  );

  return coalesce(v_inserted_ids, ARRAY[]::uuid[]);
end;
$$;

-- ============================================================
-- 4. RPC: record_feedback_delta_failure
-- ============================================================
-- Service-role-only. Persists Haiku-step failure on the feedback row so the
-- firm-side UI can flag it. No audit event (operational failure, not domain
-- — mirrors Phase 5's mark_delivery_failed convention).
create or replace function public.record_feedback_delta_failure(
  p_feedback_id uuid,
  p_error       text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.client_feedback
     set delta_generation_status = 'failed',
         delta_error             = left(p_error, 1024)
   where id = p_feedback_id;
end;
$$;

-- ============================================================
-- 5. RPC: get_feedback_load_data
-- ============================================================
-- Service-role-only. Server-side classification of the load outcome so the
-- opaque-vs-distinct logic lives in one place. format-invalid / not-found /
-- expired all collapse to 'invalid'; used_at present yields
-- 'already_submitted' (the client owns the token, so timing-safety doesn't
-- apply for this case).
create or replace function public.get_feedback_load_data(
  p_token text
) returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_token_row    public.feedback_tokens;
  v_delivery     public.deliveries;
  v_submitted_at timestamptz;
  v_token_regex  text := '^[A-Za-z0-9_-]{43}$';
begin
  if p_token !~ v_token_regex then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_token_row from public.feedback_tokens where token = p_token;
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_token_row.expires_at <= now() then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_token_row.used_at is not null then
    -- client_feedback.submitted_at is the authoritative row-insert time;
    -- feedback_tokens.used_at is the wall-clock at consumption.
    select submitted_at into v_submitted_at from public.client_feedback
     where feedback_token_id = v_token_row.id;
    return jsonb_build_object(
      'status',       'already_submitted',
      'submitted_at', v_submitted_at
    );
  end if;

  select * into v_delivery from public.deliveries where id = v_token_row.delivery_id;
  return jsonb_build_object(
    'status',            'ok',
    'delivery_snapshot', v_delivery.delivery_snapshot
  );
end;
$$;

-- ============================================================
-- 6. Permissions hardening
-- ============================================================
-- All four Phase 6 callers are service-role Edge Functions. Lock execute
-- privilege so the SECURITY DEFINER intent can't drift if
-- firm_users_full_access ever changes.
revoke all on function public.submit_feedback(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_feedback(text, jsonb) to service_role;

revoke all on function public.append_voice_guidelines_from_feedback(uuid, text[])
  from public, anon, authenticated;
grant execute on function public.append_voice_guidelines_from_feedback(uuid, text[]) to service_role;

revoke all on function public.record_feedback_delta_failure(uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_feedback_delta_failure(uuid, text) to service_role;

revoke all on function public.get_feedback_load_data(text)
  from public, anon, authenticated;
grant execute on function public.get_feedback_load_data(text) to service_role;
