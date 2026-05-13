-- ============================================================
-- ClearPress AI — Phase 4 backfill (T2 of the approved plan)
-- Best-effort latest-state replay into audit_trail_events from
-- existing content_variants + compliance_findings rows.
--
-- Why "best-effort, latest state only":
--   compliance-check/index.ts deletes prior findings on every run,
--   so pre-resolution finding state and intermediate check runs
--   are unrecoverable. Variant regenerations are also not
--   distinguishable from initial generations in this backfill
--   (no generation_params.regenerated_at marker). We record only
--   the latest observable state; every backfilled row stamps
--   details.completeness = 'latest_state_only' and details.backfilled_at.
--
-- Known caveats this backfill cannot fix:
--   - manual_review_started events are not backfilled (never persisted).
--   - compliance_checked is not emitted for variants with zero findings
--     (no row to anchor max(created_at) on). T4's live recording will
--     close the gap going forward. Until then, an approved variant with
--     no findings would block finalize_audit_report on gate I3 #6.
--   - fix_applied details.prior_status defaults to 'unresolved' for
--     backfilled rows; the actual ack -> fix path (if any) is lost.
--
-- Idempotence: (source_table, source_id, source_event) triple is the
-- deterministic key. The partial index idx_audit_trail_backfill_key
-- from 0005 backs the not-exists checks. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
-- 1. variant_generated — one per content_variants row.
-- actor_id from generation_params->>'triggered_by_user_id' (may be null);
-- actor_type follows actor_id presence.
-- ------------------------------------------------------------
insert into public.audit_trail_events (
  project_id, event_type, actor_type, actor_id, actor_name_snapshot,
  details, model_used, occurred_at
)
select
  ci.project_id,
  'variant_generated',
  case when nullif(cv.generation_params->>'triggered_by_user_id','')::uuid is not null
       then 'user' else 'system' end,
  nullif(cv.generation_params->>'triggered_by_user_id','')::uuid,
  (select u.full_name from public.users u
    where u.id = nullif(cv.generation_params->>'triggered_by_user_id','')::uuid),
  jsonb_build_object(
    'source_table', 'content_variants',
    'source_id', cv.id::text,
    'source_event', 'variant_generated',
    'completeness', 'latest_state_only',
    'backfilled_at', now(),
    'variant_id', cv.id::text,
    'content_item_id', cv.content_item_id::text,
    'variant_index', cv.variant_index,
    'brief_hash', cv.generation_params->>'brief_hash',
    'sub_type_classified', cv.generation_params->>'sub_type_classified',
    'length_norm_fallback', cv.generation_params->>'length_norm_fallback'
  ),
  cv.model_used,
  cv.created_at
from public.content_variants cv
join public.content_items ci on ci.id = cv.content_item_id
where not exists (
  select 1 from public.audit_trail_events e
   where e.details->>'source_table' = 'content_variants'
     and e.details->>'source_id' = cv.id::text
     and e.details->>'source_event' = 'variant_generated'
);

-- ------------------------------------------------------------
-- 2. compliance_checked — one per variant at max(findings.created_at).
-- deterministic_finding_count / llm_finding_count derived from the
-- regulation_reference suffix tag set by compliance-check
-- (Phase 3 H10 / D9: '[deterministic]' or '[LLM]').
-- ------------------------------------------------------------
insert into public.audit_trail_events (
  project_id, event_type, actor_type, actor_id, actor_name_snapshot,
  details, model_used, occurred_at
)
select
  ci.project_id,
  'compliance_checked',
  'system',
  null,
  null,
  jsonb_build_object(
    'source_table', 'content_variants',
    'source_id', cv.id::text,
    'source_event', 'compliance_checked',
    'completeness', 'latest_state_only',
    'backfilled_at', now(),
    'variant_id', cv.id::text,
    'deterministic_finding_count', agg.det_count,
    'llm_finding_count', agg.llm_count,
    'total_finding_count', agg.total_count
  ),
  null,
  agg.last_checked_at
from public.content_variants cv
join public.content_items ci on ci.id = cv.content_item_id
join (
  select cf.variant_id,
    count(*) filter (where cf.regulation_reference like '%[deterministic]') as det_count,
    count(*) filter (where cf.regulation_reference like '%[LLM]') as llm_count,
    count(*) as total_count,
    max(cf.created_at) as last_checked_at
  from public.compliance_findings cf
  group by cf.variant_id
) agg on agg.variant_id = cv.id
where not exists (
  select 1 from public.audit_trail_events e
   where e.details->>'source_table' = 'content_variants'
     and e.details->>'source_id' = cv.id::text
     and e.details->>'source_event' = 'compliance_checked'
);

-- ------------------------------------------------------------
-- 3. fix_applied — one per finding where resolution_status = 'fixed'.
-- prior_status defaults to 'unresolved' (we can't tell from Phase 3
-- state whether the row went through 'acknowledged' first).
-- ------------------------------------------------------------
insert into public.audit_trail_events (
  project_id, event_type, actor_type, actor_id, actor_name_snapshot,
  details, model_used, occurred_at
)
select
  ci.project_id,
  'fix_applied',
  case when cf.resolved_by is not null then 'user' else 'system' end,
  cf.resolved_by,
  (select u.full_name from public.users u where u.id = cf.resolved_by),
  jsonb_build_object(
    'source_table', 'compliance_findings',
    'source_id', cf.id::text,
    'source_event', 'fix_applied',
    'completeness', 'latest_state_only',
    'backfilled_at', now(),
    'finding_id', cf.id::text,
    'variant_id', cf.variant_id::text,
    'severity', cf.severity,
    'prior_status', 'unresolved'
  ),
  null,
  cf.resolved_at
from public.compliance_findings cf
join public.content_variants cv on cv.id = cf.variant_id
join public.content_items ci on ci.id = cv.content_item_id
where cf.resolution_status = 'fixed'
  and not exists (
    select 1 from public.audit_trail_events e
     where e.details->>'source_table' = 'compliance_findings'
       and e.details->>'source_id' = cf.id::text
       and e.details->>'source_event' = 'fix_applied'
  );
