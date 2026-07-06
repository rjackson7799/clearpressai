-- ClearPress AI — Phase 0 live DB privilege tests
-- ============================================================================
-- PURPOSE: confirm/refute the [live]-gated findings in findings.md before the
--          security statement makes any related claim.
-- HOW TO RUN: paste into the Supabase Dashboard → SQL Editor (runs as `postgres`,
--             which is a member of `anon` / `authenticated`, so SET LOCAL ROLE
--             faithfully simulates a PostgREST request from each role).
-- SAFETY: every section is wrapped in BEGIN ... ROLLBACK — nothing is committed.
--         Read-only by construction. Run section by section; read the NOTICEs.
--
-- Two layers of truth:
--   * Sections A–D simulate roles IN the DB (tests GRANTs + RLS together).
--   * Section E dumps the actual function ACLs (the ground truth for who can
--     EXECUTE what).
--   * The curl block at the bottom is the *real* internet-facing test via
--     PostgREST with the anon key — run it from a terminal for final confirmation.
-- ============================================================================


-- ============================================================================
-- §A  AUDIT-TABLE MUTABILITY  (finding 0.1)
-- Expected TODAY: the DELETE SUCCEEDS  -> confirms audit trail is NOT DB-immutable.
-- Expected AFTER the optional append-only remediation: the DELETE is BLOCKED.
-- ============================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}', true);

  do $$
  begin
    delete from public.audit_trail_events where id = '00000000-0000-0000-0000-000000000000';
    raise notice 'A1 audit_trail_events DELETE: ALLOWED (no row matched, but the statement was permitted) -> tamper-evident only, NOT immutable';
  exception when insufficient_privilege then
    raise notice 'A1 audit_trail_events DELETE: BLOCKED by privilege/policy -> append-only enforced';
  when others then
    raise notice 'A1 audit_trail_events DELETE: other error: %', sqlerrm;
  end $$;

  do $$
  begin
    update public.audit_signatures set signature_hash = 'tampered'
      where id = '00000000-0000-0000-0000-000000000000';
    raise notice 'A2 audit_signatures UPDATE: ALLOWED -> signatures are row-mutable by any authenticated user';
  exception when insufficient_privilege then
    raise notice 'A2 audit_signatures UPDATE: BLOCKED -> signatures protected';
  when others then
    raise notice 'A2 audit_signatures UPDATE: other error: %', sqlerrm;
  end $$;
rollback;


-- ============================================================================
-- §B  ANON-REACHABILITY OF THE TWO RESIDUAL DEFINER FUNCTIONS  (finding 0.3)
-- If these EXECUTE as `anon` (returning a normal result or a P0004 business
-- error like 'delivery_not_found'), they are anon-reachable -> harden with REVOKE.
-- If they raise `permission denied for function`, they are already protected.
-- ============================================================================
begin;
  set local role anon;
  select set_config('request.jwt.claims', '{"role":"anon"}', true);

  -- B1: mark_delivery_failed — DEFINER, no internal auth gate.
  do $$
  declare r public.deliveries;
  begin
    r := public.mark_delivery_failed('00000000-0000-0000-0000-000000000000', 'probe');
    raise notice 'B1 mark_delivery_failed: EXECUTED as anon (reached business logic) -> ANON-REACHABLE, add REVOKE + internal gate';
  exception when insufficient_privilege then
    raise notice 'B1 mark_delivery_failed: permission denied -> protected';
  when sqlstate 'P0004' then
    raise notice 'B1 mark_delivery_failed: EXECUTED as anon, hit business gate (%) -> ANON-REACHABLE', sqlerrm;
  when others then
    raise notice 'B1 mark_delivery_failed: other error: %', sqlerrm;
  end $$;

  -- B2: _latest_finalized_audit_report — DEFINER, no GRANT (PUBLIC default), no gate.
  do $$
  declare r public.audit_reports;
  begin
    r := public._latest_finalized_audit_report('00000000-0000-0000-0000-000000000000');
    raise notice 'B2 _latest_finalized_audit_report: EXECUTED as anon -> ANON-REACHABLE (info disclosure), add REVOKE';
  exception when insufficient_privilege then
    raise notice 'B2 _latest_finalized_audit_report: permission denied -> protected';
  when others then
    raise notice 'B2 _latest_finalized_audit_report: other error: %', sqlerrm;
  end $$;

  -- B3: _build_audit_snapshot — same helper class; confirm.
  do $$
  begin
    perform public._build_audit_snapshot('00000000-0000-0000-0000-000000000000');
    raise notice 'B3 _build_audit_snapshot: EXECUTED as anon -> ANON-REACHABLE, add REVOKE';
  exception when insufficient_privilege then
    raise notice 'B3 _build_audit_snapshot: permission denied -> protected';
  when others then
    raise notice 'B3 _build_audit_snapshot: executed/other: %', sqlerrm;
  end $$;
rollback;


-- ============================================================================
-- §C  PUBLIC DATA TABLES MUST NOT LEAK TO anon
-- Expected: 0 rows (RLS firm_users_full_access requires authenticated).
-- ============================================================================
begin;
  set local role anon;
  select set_config('request.jwt.claims', '{"role":"anon"}', true);
  do $$
  declare n int;
  begin
    select count(*) into n from public.clients;
    raise notice 'C1 anon SELECT clients: % rows visible (expected 0)', n;
    select count(*) into n from public.deliveries;
    raise notice 'C2 anon SELECT deliveries: % rows visible (expected 0)', n;
    select count(*) into n from public.feedback_tokens;
    raise notice 'C3 anon SELECT feedback_tokens: % rows visible (expected 0)', n;
  exception when insufficient_privilege then
    raise notice 'C anon SELECT: BLOCKED by privilege (also fine)';
  end $$;
rollback;


-- ============================================================================
-- §D  SERVICE-ROLE-ONLY RPCs MUST REJECT authenticated  (Phase 6 hardening check)
-- Expected: permission denied (these were REVOKE'd from authenticated in 0009).
-- ============================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}', true);
  do $$
  begin
    perform public.submit_feedback('x', '{}'::jsonb);
    raise notice 'D1 submit_feedback as authenticated: EXECUTED (UNEXPECTED — should be service_role only)';
  exception when insufficient_privilege then
    raise notice 'D1 submit_feedback as authenticated: permission denied -> correctly hardened';
  when others then
    raise notice 'D1 submit_feedback as authenticated: other error (reached body?): %', sqlerrm;
  end $$;
rollback;


-- ============================================================================
-- §E  GROUND TRUTH: full EXECUTE-grant inventory for every public function.
-- Read this table to see exactly which functions are executable by PUBLIC / anon.
-- "grantee = PUBLIC" (or anon) on a SECURITY DEFINER function = anon-reachable.
-- ============================================================================
select
  p.proname              as function,
  pg_get_function_identity_arguments(p.oid) as args,
  case p.prosecdef when true then 'DEFINER' else 'INVOKER' end as security,
  coalesce(g.grantee, '(no explicit grant = PUBLIC default)') as execute_grantee
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join information_schema.role_routine_grants g
  on g.routine_schema = n.nspname
 and g.routine_name = p.proname
 and g.privilege_type = 'EXECUTE'
where n.nspname = 'public'
order by p.proname, execute_grantee;


-- ============================================================================
-- §F  (terminal, not SQL editor)  REAL internet-facing PostgREST probe with the
--     ANON key. This is the authoritative "is it reachable from the web" test.
--     Replace <ANON_KEY>. A 200/404-business-error = reachable; 401/403 = protected.
-- ----------------------------------------------------------------------------
-- curl -s -o /dev/null -w "%{http_code}\n" \
--   -X POST 'https://hsdqvlnzorjzxfaqijns.supabase.co/rest/v1/rpc/mark_delivery_failed' \
--   -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
--   -H "Content-Type: application/json" \
--   -d '{"p_delivery_id":"00000000-0000-0000-0000-000000000000","p_error_message":"probe"}'
--
-- curl -s -o /dev/null -w "%{http_code}\n" \
--   -X POST 'https://hsdqvlnzorjzxfaqijns.supabase.co/rest/v1/rpc/_latest_finalized_audit_report' \
--   -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
--   -H "Content-Type: application/json" \
--   -d '{"p_project_id":"00000000-0000-0000-0000-000000000000"}'
-- ============================================================================
