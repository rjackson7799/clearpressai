-- ============================================================
-- ClearPress AI — operational seed: internal-feedback notifications
--
-- WHAT
-- ----
-- Seeds the two `app_config` rows the notify-feedback Edge Function
-- reads when someone submits internal feedback:
--
--   FEEDBACK_NOTIFY_EMAILS — JSON-array text of recipient addresses that
--                            get a "new feedback" email on each submission.
--   APP_URL_BASE           — absolute origin of the authenticated app,
--                            used to build the "/feedback" deep link in
--                            the notification email. This is the app shell
--                            origin, NOT PUBLIC_FEEDBACK_URL_BASE (which
--                            points at the anonymous /f/:token page).
--
-- notify-feedback is best-effort: if FEEDBACK_NOTIFY_EMAILS is absent the
-- function logs and returns 200 — the feedback row is the source of truth.
--
-- WHY THIS ISN'T A NUMBERED MIGRATION
-- -----------------------------------
-- `op_` prefix -> `supabase db push --linked` ignores it. Applying is a
-- manual operator step, same as op_phase5_app_config_seed.sql.
--
-- HOW TO APPLY
-- ------------
-- Paste this body into the Supabase dashboard SQL editor for project
-- hsdqvlnzorjzxfaqijns and run. Idempotent.
--
-- VERIFICATION
-- ------------
--   select key, value from public.app_config
--   where key in ('FEEDBACK_NOTIFY_EMAILS', 'APP_URL_BASE') order by key;
-- ============================================================

-- Stored as text; notify-feedback parses via JSON.parse, so the payload
-- MUST be a valid JSON-array text literal.
insert into public.app_config (key, value)
values ('FEEDBACK_NOTIFY_EMAILS', '["ryan.jackson.2009@gmail.com"]')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

insert into public.app_config (key, value)
values ('APP_URL_BASE', 'https://www.clearpressai.com')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();
