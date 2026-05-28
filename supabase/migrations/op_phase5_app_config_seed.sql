-- ============================================================
-- ClearPress AI — Phase 5 operational seed: app_config
--
-- WHAT
-- ----
-- Seeds the three `app_config` rows the Delivery Composer + send
-- pipeline need:
--
--   RESEND_FROM_NAME    — display name in the From header
--   RESEND_FROM_EMAIL   — sender mailbox (must be on a Resend-
--                         verified domain at send time)
--   DEFAULT_BCC_EMAILS  — JSON-array text of internal BCC addresses
--                         that create_delivery merges into every send
--                         (UNION with caller-supplied BCC, distinct)
--
-- Without RESEND_FROM_NAME / RESEND_FROM_EMAIL, get_firm_config_public()
-- raises P0004 / app_config_missing and the composer Sender banner
-- shows the error in red. DEFAULT_BCC_EMAILS is optional —
-- create_delivery coalesces a missing row to '[]'::jsonb.
--
-- WHY THIS ISN'T A NUMBERED MIGRATION
-- -----------------------------------
-- Numbered migrations (0001…0011) live under the same directory but
-- carry a digit prefix that `supabase db push --linked` picks up.
-- This file has an `op_` prefix so the CLI ignores it — applying it
-- is a manual, operator-driven step, just like op_phase5_pg_cron.sql
-- referenced in CLAUDE.md.
--
-- HOW TO APPLY
-- ------------
-- Paste the entire body of this file into the Supabase dashboard
-- SQL editor for project hsdqvlnzorjzxfaqijns and run. Idempotent —
-- re-running upserts the same values and bumps `updated_at`.
--
-- VERIFICATION
-- ------------
--   select key, value from public.app_config order by key;
--
-- Expected: three rows in alphabetical key order.
-- ============================================================

insert into public.app_config (key, value)
values ('RESEND_FROM_NAME', 'ClearPress AI')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

insert into public.app_config (key, value)
values ('RESEND_FROM_EMAIL', 'noreply@clearpressai.com')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

-- Stored as text; create_delivery casts via `value::jsonb` so the
-- payload MUST be a valid JSON-array text literal.
insert into public.app_config (key, value)
values ('DEFAULT_BCC_EMAILS', '["ryan.jackson.2009@gmail.com"]')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();
