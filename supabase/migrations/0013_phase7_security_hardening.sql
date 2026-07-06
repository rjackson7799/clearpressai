-- ============================================================
-- ClearPress AI — Phase 7 security hardening (migration 0013)
--
-- Closes three findings from the Phase 0 security audit
-- (docs/security-audit/findings.md):
--   0.1  Audit trail is tamper-evident but not DB-enforced immutable.
--   0.3  Two DEFINER helpers + mark_delivery_failed are anon-reachable.
--   0.4  No application-level rate limiting on public feedback endpoints.
--
-- Applied via the Supabase dashboard SQL editor (project
-- hsdqvlnzorjzxfaqijns), consistent with 0004–0012. After applying, run
--   npx supabase migration repair --status applied 0013 --linked
-- Idempotent — safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 0.1  Append-only enforcement on the audit tables
--
-- Uniform RLS (firm_users_full_access FOR ALL) lets any authenticated
-- session UPDATE/DELETE audit rows directly via PostgREST. The audit
-- trail is INSERT-only by design (verified: no migration or RPC ever
-- UPDATEs/DELETEs audit_trail_events or audit_signatures), so a BEFORE
-- UPDATE OR DELETE trigger that always raises is safe and makes the trail
-- DB-enforced immutable. TRUNCATE is not reachable via PostgREST, so it is
-- not the concern here; UPDATE/DELETE are the exposed surface.
-- ------------------------------------------------------------
create or replace function public._deny_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit records are append-only: %.% cannot be modified or deleted',
    tg_table_schema, tg_table_name
    using errcode = 'P0001';
end;
$$;

drop trigger if exists trg_audit_trail_events_append_only
  on public.audit_trail_events;
create trigger trg_audit_trail_events_append_only
  before update or delete on public.audit_trail_events
  for each row execute function public._deny_audit_mutation();

drop trigger if exists trg_audit_signatures_append_only
  on public.audit_signatures;
create trigger trg_audit_signatures_append_only
  before update or delete on public.audit_signatures
  for each row execute function public._deny_audit_mutation();

-- ------------------------------------------------------------
-- 0.3  Least-privilege grants on SECURITY DEFINER functions
--
-- A new function grants EXECUTE to PUBLIC by default, and anon/authenticated
-- are members of PUBLIC — so a DEFINER function without an internal auth gate
-- is callable by anon via /rest/v1/rpc/<fn>. Revoke PUBLIC and re-grant only
-- the roles that actually call each function (verified against the Edge
-- Function callers). Owner (postgres) retains EXECUTE regardless, so the
-- internal caller chains among these DEFINER functions keep working.
-- ------------------------------------------------------------

-- mark_delivery_failed: no internal gate; called by send-delivery (user JWT →
-- authenticated) and process-scheduled-sends (service_role). Closes the anon
-- "flip any delivery to failed" hole.
revoke all on function public.mark_delivery_failed(uuid, text) from public;
grant execute on function public.mark_delivery_failed(uuid, text)
  to authenticated, service_role;

-- Service-role-only (both already raise on non-service_role callers; this
-- removes the anon/authenticated grant so they can't even be invoked).
revoke all on function public.mark_delivery_sent_system(uuid, text) from public;
grant execute on function public.mark_delivery_sent_system(uuid, text)
  to service_role;

revoke all on function public.record_scheduled_attempt_failure(uuid, text) from public;
grant execute on function public.record_scheduled_attempt_failure(uuid, text)
  to service_role;

-- _latest_finalized_audit_report: called only internally by create_delivery
-- (DEFINER, runs as owner) — no external caller, so revoke every non-owner
-- grant. Closes the anon "read a finalized report by project UUID" hole.
revoke all on function public._latest_finalized_audit_report(uuid)
  from public, anon, authenticated;

-- _build_audit_snapshot: called by sign-audit-report (user JWT → authenticated)
-- and internally by finalize/revise (as owner). Keep authenticated, drop anon.
revoke all on function public._build_audit_snapshot(uuid) from public;
grant execute on function public._build_audit_snapshot(uuid) to authenticated;

-- ------------------------------------------------------------
-- 0.4  Application-level rate limiting for the public feedback endpoints
--
-- Token entropy is strong, so brute force isn't the risk — volume/cost is
-- (feedback-submit fires an anonymous Anthropic call per accepted submission;
-- feedback-load hits a DB RPC per request). This is a coarse per-identifier
-- sliding-window counter the Edge Functions call as service_role. It fails
-- OPEN in the Edge helper, so an outage never takes down the feedback flow.
-- ------------------------------------------------------------
create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_hits_lookup
  on public.rate_limit_hits (bucket, identifier, created_at);

-- No RLS policy → no direct anon/authenticated access. Only the DEFINER
-- function below (owner) touches the table.
alter table public.rate_limit_hits enable row level security;

create or replace function public.check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Opportunistic GC of rows older than any plausible window (1h) so the
  -- table doesn't grow unbounded on a low-traffic single-firm deployment.
  delete from public.rate_limit_hits
    where created_at < now() - interval '1 hour';

  select count(*) into v_count
    from public.rate_limit_hits
    where bucket = p_bucket
      and identifier = p_identifier
      and created_at > now() - make_interval(secs => p_window_seconds);

  insert into public.rate_limit_hits (bucket, identifier)
    values (p_bucket, p_identifier);

  -- true = under the limit (allow); false = at/over the limit (block).
  return v_count < p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, text, int, int)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, text, int, int)
  to service_role;
