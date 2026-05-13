-- ============================================================
-- ClearPress AI — Phase 4 schema (audit report, signature, trail)
-- Reference: approved plan at C:\Users\HCI\.claude\plans\i-m-starting-phase-4-gentle-ocean.md
-- Integrity model: I1 server-side audit writes only;
--                  I2 finalized reports immutable by snapshot;
--                  I3 finalize gates inside transaction;
--                  I4 domain + audit writes in one transaction.
-- ============================================================

-- ------------------------------------------------------------
-- 1. audit_trail_events.event_type: add the four Phase 4 types
-- ------------------------------------------------------------
alter table public.audit_trail_events
  drop constraint audit_trail_events_event_type_check;
alter table public.audit_trail_events
  add constraint audit_trail_events_event_type_check
  check (event_type in (
    'variant_generated', 'compliance_checked', 'manual_review_started',
    'fix_applied', 'compliance_rechecked', 'sign_off',
    'delivery_sent', 'feedback_received', 'voice_updated',
    'audit_report_created', 'audit_revision_started',
    'variant_approved', 'acknowledge_finding'
  ));

-- ------------------------------------------------------------
-- 2. audit_reports: numeric version + snapshots
-- No rows exist (Phase 3 didn't create reports), so drop+re-add is safe.
-- ------------------------------------------------------------
alter table public.audit_reports drop column version;
alter table public.audit_reports add column version_major int not null default 1;
alter table public.audit_reports add column version_minor int not null default 0;
alter table public.audit_reports
  add column version text generated always as
    (version_major::text || '.' || version_minor::text) stored;
alter table public.audit_reports add column report_snapshot jsonb;
alter table public.audit_reports add column assembled_snapshot jsonb;

-- ------------------------------------------------------------
-- 3. audit_signatures: persisted canonical payload (HMAC input)
-- ------------------------------------------------------------
alter table public.audit_signatures add column canonical_payload jsonb not null;

-- ------------------------------------------------------------
-- 4. Sequence + uniqueness for report_id_display + version pair
-- ------------------------------------------------------------
create sequence public.audit_report_display_seq;

alter table public.audit_reports
  add constraint audit_reports_report_id_display_key unique (report_id_display);
alter table public.audit_reports
  add constraint audit_reports_project_version_key
  unique (project_id, version_major, version_minor);

-- ------------------------------------------------------------
-- 5. Indexes
-- ------------------------------------------------------------
create index idx_audit_trail_proj_event_time
  on public.audit_trail_events (project_id, event_type, occurred_at);

create index idx_audit_signatures_report_signed
  on public.audit_signatures (audit_report_id, signed_at);

-- Backs the idempotence check in migration 0006 backfill.
create index idx_audit_trail_backfill_key
  on public.audit_trail_events ((details->>'source_table'), (details->>'source_id'))
  where details ? 'source_table';

-- ============================================================
-- 6. Snapshot helper
-- ============================================================
-- Deterministic content snapshot used by assemble_audit_report,
-- revise_audit_report, and finalize_audit_report. Includes only
-- approved variants. Sort order: variants by variant_index, then
-- findings by id. Snapshots from this function compare value-equal
-- to the same call made twice over unchanged state (jsonb equality).
create or replace function public._build_audit_snapshot(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin
  with variants as (
    select cv.*
      from public.content_variants cv
      join public.content_items ci on ci.id = cv.content_item_id
     where ci.project_id = p_project_id
       and cv.internal_approved = true
  ),
  findings_per_variant as (
    select cf.variant_id,
           jsonb_agg(
             jsonb_build_object(
               'id', cf.id,
               'variant_id', cf.variant_id,
               'severity', cf.severity,
               'source_text', cf.source_text,
               'paragraph_index', cf.paragraph_index,
               'explanation', cf.explanation,
               'regulation_reference', cf.regulation_reference,
               'suggested_correction', cf.suggested_correction,
               'resolution_status', cf.resolution_status,
               'resolved_by', case when cf.resolved_by is null then null else
                 jsonb_build_object(
                   'id', cf.resolved_by,
                   'name', (select full_name from public.users where id = cf.resolved_by)
                 )
               end,
               'resolved_at', cf.resolved_at,
               'created_at', cf.created_at
             ) order by cf.id
           ) as findings
      from public.compliance_findings cf
      join variants v on v.id = cf.variant_id
     group by cf.variant_id
  )
  select jsonb_build_object(
    'variants',
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'variant_label', v.variant_label,
        'variant_index', v.variant_index,
        'body_text', v.body_text,
        'body_html', v.body_html,
        'char_count', v.char_count,
        'reading_time_seconds', v.reading_time_seconds,
        'internal_approved_by', case when v.internal_approved_by is null then null else
          jsonb_build_object(
            'id', v.internal_approved_by,
            'name', (select full_name from public.users where id = v.internal_approved_by)
          )
        end,
        'internal_approved_at', v.internal_approved_at,
        'model_used', v.model_used,
        'generation_params', v.generation_params,
        'findings', coalesce(fpv.findings, '[]'::jsonb)
      ) order by v.variant_index
    ), '[]'::jsonb)
  ) into v_result
  from variants v
  left join findings_per_variant fpv on fpv.variant_id = v.id;

  return v_result;
end;
$$;

-- ============================================================
-- 7. RPC: approve_variant
-- ============================================================
-- I4: domain mutation + audit write in one transaction.
-- updated_at is NOT bumped (would falsely mark compliance stale).
create or replace function public.approve_variant(p_variant_id uuid)
returns public.content_variants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_row public.content_variants;
  v_project_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_row from public.content_variants
    where id = p_variant_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'variant_not_found';
  end if;

  update public.content_variants
     set internal_approved = true,
         internal_approved_by = v_actor,
         internal_approved_at = now()
   where id = p_variant_id
   returning * into v_row;

  select project_id into v_project_id
    from public.content_items where id = v_row.content_item_id;
  select full_name into v_actor_name
    from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_project_id, 'variant_approved', 'user', v_actor, v_actor_name,
    jsonb_build_object('variant_id', p_variant_id, 'content_item_id', v_row.content_item_id)
  );

  return v_row;
end;
$$;

grant execute on function public.approve_variant(uuid) to authenticated;

-- ============================================================
-- 8. RPC: apply_fix
-- ============================================================
-- Atomic body edit + finding resolution.
-- Bumps content_variants.updated_at — intentional; per gate I3 #5,
-- callers must re-run compliance before sign-off.
-- Q4: allow unresolved -> fixed AND acknowledged -> fixed. Reject only 'fixed'.
create or replace function public.apply_fix(
  p_finding_id uuid,
  p_new_body_text text,
  p_new_body_html text,
  p_new_char_count int,
  p_new_reading_time_seconds int
) returns public.compliance_findings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_finding public.compliance_findings;
  v_variant public.content_variants;
  v_project_id uuid;
  v_prior_status text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_finding from public.compliance_findings
    where id = p_finding_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'finding_not_found';
  end if;
  if v_finding.resolution_status = 'fixed' then
    raise exception using errcode = 'P0004', message = 'finding_already_fixed';
  end if;
  v_prior_status := v_finding.resolution_status;

  select * into v_variant from public.content_variants
    where id = v_finding.variant_id for update;

  update public.content_variants
     set body_text = p_new_body_text,
         body_html = p_new_body_html,
         char_count = p_new_char_count,
         reading_time_seconds = p_new_reading_time_seconds,
         updated_at = now()
   where id = v_variant.id;

  update public.compliance_findings
     set resolution_status = 'fixed',
         resolved_by = v_actor,
         resolved_at = now()
   where id = p_finding_id
   returning * into v_finding;

  select project_id into v_project_id
    from public.content_items where id = v_variant.content_item_id;
  select full_name into v_actor_name
    from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_project_id, 'fix_applied', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'finding_id', p_finding_id,
      'variant_id', v_variant.id,
      'severity', v_finding.severity,
      'prior_status', v_prior_status
    )
  );

  return v_finding;
end;
$$;

grant execute on function public.apply_fix(uuid, text, text, int, int) to authenticated;

-- ============================================================
-- 9. RPC: acknowledge_finding
-- ============================================================
create or replace function public.acknowledge_finding(p_finding_id uuid)
returns public.compliance_findings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_finding public.compliance_findings;
  v_variant public.content_variants;
  v_project_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_finding from public.compliance_findings
    where id = p_finding_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'finding_not_found';
  end if;
  if v_finding.resolution_status <> 'unresolved' then
    raise exception using errcode = 'P0004', message = 'finding_already_resolved';
  end if;

  update public.compliance_findings
     set resolution_status = 'acknowledged',
         resolved_by = v_actor,
         resolved_at = now()
   where id = p_finding_id
   returning * into v_finding;

  select * into v_variant from public.content_variants where id = v_finding.variant_id;
  select project_id into v_project_id from public.content_items where id = v_variant.content_item_id;
  select full_name into v_actor_name from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_project_id, 'acknowledge_finding', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'finding_id', p_finding_id,
      'variant_id', v_variant.id,
      'severity', v_finding.severity
    )
  );

  return v_finding;
end;
$$;

grant execute on function public.acknowledge_finding(uuid) to authenticated;

-- ============================================================
-- 10. RPC: record_manual_review_started
-- ============================================================
-- Idempotent per (project_id, variant_id, actor_id). Client may
-- fire eagerly (e.g., on editor focus).
create or replace function public.record_manual_review_started(
  p_project_id uuid,
  p_variant_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  if exists (
    select 1 from public.audit_trail_events
     where project_id = p_project_id
       and event_type = 'manual_review_started'
       and (details->>'variant_id')::uuid = p_variant_id
       and actor_id = v_actor
  ) then
    return;
  end if;

  select full_name into v_actor_name from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    p_project_id, 'manual_review_started', 'user', v_actor, v_actor_name,
    jsonb_build_object('variant_id', p_variant_id)
  );
end;
$$;

grant execute on function public.record_manual_review_started(uuid, uuid) to authenticated;

-- ============================================================
-- 11. RPC: assemble_audit_report
-- ============================================================
-- Locks the project's reports for update; asserts no draft exists;
-- asserts >=1 approved variant; inserts report in 'draft' + audit
-- event; populates assembled_snapshot for in-flight render parity
-- (the immutable snapshot lands at finalize-time).
create or replace function public.assemble_audit_report(p_project_id uuid)
returns public.audit_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_report public.audit_reports;
  v_snapshot jsonb;
  v_display text;
  v_approved_count int;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  perform 1 from public.audit_reports where project_id = p_project_id for update;

  if exists (
    select 1 from public.audit_reports
     where project_id = p_project_id and status = 'draft'
  ) then
    raise exception using errcode = 'P0004', message = 'draft_report_already_exists';
  end if;

  select count(*) into v_approved_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = p_project_id and cv.internal_approved = true;
  if v_approved_count < 1 then
    raise exception using errcode = 'P0004', message = 'no_approved_variants';
  end if;

  v_snapshot := public._build_audit_snapshot(p_project_id);

  v_display := 'AUD-'
    || to_char(now() at time zone 'Asia/Tokyo', 'YYYY-MM-DD')
    || '-'
    || lpad(nextval('public.audit_report_display_seq')::text, 6, '0');

  insert into public.audit_reports
    (project_id, report_id_display, version_major, version_minor,
     previous_version_id, status, created_by, assembled_snapshot)
  values
    (p_project_id, v_display, 1, 0, null, 'draft', v_actor, v_snapshot)
  returning * into v_report;

  select full_name into v_actor_name from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    p_project_id, v_report.id, 'audit_report_created', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'report_id_display', v_display,
      'version_major', 1,
      'version_minor', 0,
      'approved_variant_count', v_approved_count
    )
  );

  return v_report;
end;
$$;

grant execute on function public.assemble_audit_report(uuid) to authenticated;

-- ============================================================
-- 12. RPC: revise_audit_report
-- ============================================================
-- Clones a finalized head-of-chain report; bumps version_minor;
-- new row is 'draft'; predecessor stays 'finalized' until V1.x+1 is signed.
create or replace function public.revise_audit_report(
  p_audit_report_id uuid,
  p_comment text
) returns public.audit_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_source public.audit_reports;
  v_new public.audit_reports;
  v_display text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_source from public.audit_reports
    where id = p_audit_report_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'report_not_found';
  end if;
  if v_source.status <> 'finalized' then
    raise exception using errcode = 'P0004', message = 'source_not_finalized';
  end if;

  perform 1 from public.audit_reports
    where project_id = v_source.project_id for update;

  if exists (
    select 1 from public.audit_reports
     where previous_version_id = p_audit_report_id
  ) then
    raise exception using errcode = 'P0004', message = 'not_head_of_chain';
  end if;

  if exists (
    select 1 from public.audit_reports
     where project_id = v_source.project_id and status = 'draft'
  ) then
    raise exception using errcode = 'P0004', message = 'draft_report_already_exists';
  end if;

  v_display := 'AUD-'
    || to_char(now() at time zone 'Asia/Tokyo', 'YYYY-MM-DD')
    || '-'
    || lpad(nextval('public.audit_report_display_seq')::text, 6, '0');

  insert into public.audit_reports
    (project_id, report_id_display, version_major, version_minor,
     previous_version_id, status, reviewer_comments, created_by, assembled_snapshot)
  values
    (v_source.project_id, v_display,
     v_source.version_major, v_source.version_minor + 1,
     v_source.id, 'draft', p_comment, v_actor,
     public._build_audit_snapshot(v_source.project_id))
  returning * into v_new;

  select full_name into v_actor_name from public.users where id = v_actor;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_new.project_id, v_new.id, 'audit_revision_started', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'source_report_id', v_source.id,
      'source_version', v_source.version,
      'new_report_id_display', v_display,
      'new_version_major', v_new.version_major,
      'new_version_minor', v_new.version_minor,
      'comment', p_comment
    )
  );

  return v_new;
end;
$$;

grant execute on function public.revise_audit_report(uuid, text) to authenticated;

-- ============================================================
-- 13. RPC: finalize_audit_report
-- ============================================================
-- The sole gatekeeper for sign-off. Enforces every I3 gate inside
-- one transaction. Re-computes server-side snapshot and rejects if
-- it doesn't match canonical_payload.report_snapshot (jsonb value
-- equality). Signer is auth.uid(); the canonical payload's
-- signer_id must agree.
create or replace function public.finalize_audit_report(
  p_audit_report_id uuid,
  p_signature_hash text,
  p_canonical_payload jsonb
) returns public.audit_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_actor_role text;
  v_report public.audit_reports;
  v_snapshot jsonb;
  v_payload_signer text;
  v_approved_count int;
  v_unresolved_blocker_count int;
  v_stale_count int;
  v_compliance_unchecked_count int;
  v_signature_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = 'P0004', message = 'not_authenticated';
  end if;

  select * into v_report from public.audit_reports
    where id = p_audit_report_id for update;
  if not found then
    raise exception using errcode = 'P0004', message = 'report_not_found';
  end if;

  -- Gate 1: status must be draft.
  if v_report.status <> 'draft' then
    raise exception using errcode = 'P0004', message = 'report_not_draft';
  end if;

  -- Gate 7: signer recorded in canonical_payload must equal auth.uid().
  v_payload_signer := p_canonical_payload->>'signer_id';
  if v_payload_signer is null or v_payload_signer::uuid <> v_actor then
    raise exception using errcode = 'P0004', message = 'signer_mismatch';
  end if;

  -- Lock the project's variants + findings so the gate checks see a stable snapshot.
  perform 1
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
   for update;

  -- Gate 2: at least one approved variant in the project.
  select count(*) into v_approved_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id and cv.internal_approved = true;
  if v_approved_count < 1 then
    raise exception using errcode = 'P0004', message = 'no_approved_variants';
  end if;

  -- Gate 3 is vacuously true: the included set IS the approved set.

  -- Gate 4: no unresolved blockers on approved variants.
  select count(*) into v_unresolved_blocker_count
    from public.compliance_findings cf
    join public.content_variants cv on cv.id = cf.variant_id
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
     and cv.internal_approved = true
     and cf.severity = 'blocker'
     and cf.resolution_status = 'unresolved';
  if v_unresolved_blocker_count > 0 then
    raise exception using errcode = 'P0004', message = 'unresolved_blockers_exist';
  end if;

  -- Gate 5: no compliance staleness on approved variants.
  -- A variant is stale iff max(finding.created_at) < variant.updated_at.
  select count(*) into v_stale_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
     and cv.internal_approved = true
     and coalesce(
       (select max(cf.created_at) from public.compliance_findings cf where cf.variant_id = cv.id),
       'epoch'::timestamptz
     ) < cv.updated_at;
  if v_stale_count > 0 then
    raise exception using errcode = 'P0004', message = 'compliance_stale';
  end if;

  -- Gate 6: every approved variant has at least one compliance_checked event.
  -- Canonical join key is details->>'variant_id' (Q3).
  select count(*) into v_compliance_unchecked_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
     and cv.internal_approved = true
     and not exists (
       select 1 from public.audit_trail_events ate
        where ate.project_id = v_report.project_id
          and ate.event_type = 'compliance_checked'
          and (ate.details->>'variant_id')::uuid = cv.id
     );
  if v_compliance_unchecked_count > 0 then
    raise exception using errcode = 'P0004', message = 'compliance_not_run';
  end if;

  -- Snapshot agreement: re-build server-side and compare to payload.
  v_snapshot := public._build_audit_snapshot(v_report.project_id);
  if (p_canonical_payload->'report_snapshot') is null
     or (p_canonical_payload->'report_snapshot') <> v_snapshot then
    raise exception using errcode = 'P0004', message = 'snapshot_mismatch';
  end if;

  -- All gates pass. Persist snapshot + status, sign, cascade predecessor, audit.
  update public.audit_reports
     set status = 'finalized',
         finalized_at = now(),
         report_snapshot = v_snapshot
   where id = p_audit_report_id
   returning * into v_report;

  select full_name, role into v_actor_name, v_actor_role
    from public.users where id = v_actor;

  insert into public.audit_signatures
    (audit_report_id, signer_id, signer_name_snapshot, signer_role_snapshot,
     signature_hash, canonical_payload)
  values
    (v_report.id, v_actor, v_actor_name, v_actor_role,
     p_signature_hash, p_canonical_payload)
  returning id into v_signature_id;

  if v_report.previous_version_id is not null then
    update public.audit_reports
       set status = 'revised'
     where id = v_report.previous_version_id;
  end if;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id, actor_name_snapshot, details)
  values (
    v_report.project_id, v_report.id, 'sign_off', 'user', v_actor, v_actor_name,
    jsonb_build_object(
      'signature_id', v_signature_id,
      'signature_hash', p_signature_hash,
      'version_major', v_report.version_major,
      'version_minor', v_report.version_minor,
      'predecessor_id', v_report.previous_version_id
    )
  );

  return v_report;
end;
$$;

grant execute on function public.finalize_audit_report(uuid, text, jsonb) to authenticated;
