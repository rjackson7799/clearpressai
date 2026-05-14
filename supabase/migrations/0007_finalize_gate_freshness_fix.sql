-- ============================================================
-- ClearPress AI — Phase 4 hotfix (post-T12 smoke 2026-05-13)
--
-- Issue: finalize_audit_report gate I3 #5 used max(compliance_findings.created_at)
-- as the freshness signal. When a compliance run produced ZERO findings (clean
-- body), max() returns NULL, COALESCE-to-epoch defeats the gate, and an
-- otherwise-valid sign-off is rejected with `compliance_stale`.
--
-- Fix: track freshness via the `compliance_checked` / `compliance_rechecked`
-- audit-event timestamp. A check produces an event regardless of finding
-- count, so this works for clean and dirty bodies alike.
--
-- Also widens gate 6 to accept either event type. Phase 4 T4 emits
-- `compliance_rechecked` when prior findings existed; gate 6 was only
-- checking `compliance_checked`, which happens to pass today only because
-- backfilled rows from migration 0006 always carry that older event type.
-- A variant born in Phase 4 with only `compliance_rechecked` events would
-- have failed gate 6 spuriously. Both event types now count.
-- ============================================================

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

  if v_report.status <> 'draft' then
    raise exception using errcode = 'P0004', message = 'report_not_draft';
  end if;

  v_payload_signer := p_canonical_payload->>'signer_id';
  if v_payload_signer is null or v_payload_signer::uuid <> v_actor then
    raise exception using errcode = 'P0004', message = 'signer_mismatch';
  end if;

  perform 1
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
   for update;

  select count(*) into v_approved_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id and cv.internal_approved = true;
  if v_approved_count < 1 then
    raise exception using errcode = 'P0004', message = 'no_approved_variants';
  end if;

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

  -- Gate 5 (fixed): a variant is stale iff the most recent compliance run
  -- (per audit_trail_events) is older than the variant's updated_at. Uses
  -- the audit event so clean checks (zero findings) don't trigger false
  -- staleness.
  select count(*) into v_stale_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
     and cv.internal_approved = true
     and coalesce(
       (select max(ate.occurred_at) from public.audit_trail_events ate
         where ate.event_type in ('compliance_checked', 'compliance_rechecked')
           and (ate.details->>'variant_id')::uuid = cv.id),
       'epoch'::timestamptz
     ) < cv.updated_at;
  if v_stale_count > 0 then
    raise exception using errcode = 'P0004', message = 'compliance_stale';
  end if;

  -- Gate 6 (widened): every approved variant has at least one
  -- compliance_checked OR compliance_rechecked event. Either event type
  -- proves compliance was run.
  select count(*) into v_compliance_unchecked_count
    from public.content_variants cv
    join public.content_items ci on ci.id = cv.content_item_id
   where ci.project_id = v_report.project_id
     and cv.internal_approved = true
     and not exists (
       select 1 from public.audit_trail_events ate
        where ate.project_id = v_report.project_id
          and ate.event_type in ('compliance_checked', 'compliance_rechecked')
          and (ate.details->>'variant_id')::uuid = cv.id
     );
  if v_compliance_unchecked_count > 0 then
    raise exception using errcode = 'P0004', message = 'compliance_not_run';
  end if;

  v_snapshot := public._build_audit_snapshot(v_report.project_id);
  if (p_canonical_payload->'report_snapshot') is null
     or (p_canonical_payload->'report_snapshot') <> v_snapshot then
    raise exception using errcode = 'P0004', message = 'snapshot_mismatch';
  end if;

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
