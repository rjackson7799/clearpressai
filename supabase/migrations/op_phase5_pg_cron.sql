-- ============================================================
-- ClearPress AI — Phase 5 operational wiring: pg_cron scheduled sends
--
-- WHAT
-- ----
-- Schedules the `process-scheduled-sends` Edge Function to run every
-- minute. Without this job, a user can schedule a delivery, receive a
-- "scheduled" success toast, and the email is NEVER sent — the composer
-- writes a status='scheduled' row that nothing ever picks up.
--
-- The cron job POSTs to the Edge Function with the service-role key
-- (read from Postgres Vault) in the Authorization header. The function
-- verifies `Bearer <service_role_key>` as defense-in-depth on top of the
-- platform JWT gate (see process-scheduled-sends/index.ts:96-104).
--
-- WHY THIS ISN'T A NUMBERED MIGRATION
-- -----------------------------------
-- Same rationale as op_phase5_app_config_seed.sql: the `op_` prefix keeps
-- `supabase db push --linked` from picking it up. It is an operator-driven
-- step with two external preconditions (below) that can't live in schema.
--
-- PRECONDITIONS (verify BEFORE running the schedule block)
-- --------------------------------------------------------
--   1. Extensions pg_cron + pg_net are enabled:
--        select extname from pg_extension where extname in ('pg_cron','pg_net');
--      If missing, enable via dashboard → Database → Extensions (or:
--        create extension if not exists pg_cron;
--        create extension if not exists pg_net;)
--
--   2. The service-role key is stored in Vault under name 'service_role_key':
--        select count(*) from vault.decrypted_secrets where name='service_role_key';
--      If 0, create it (paste the project's service_role key):
--        select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--
--   3. The Edge Function secret PUBLIC_FEEDBACK_URL_BASE is set (the function
--      500s without it) — `npx supabase secrets set PUBLIC_FEEDBACK_URL_BASE=...`.
--
-- HOW TO APPLY
-- ------------
-- Paste the entire body below into the Supabase dashboard SQL editor for
-- project hsdqvlnzorjzxfaqijns and run. Idempotent — the DO block drops any
-- existing job of the same name before rescheduling, so re-running is safe.
--
-- VERIFICATION
-- ------------
--   select jobid, schedule, jobname, active from cron.job
--     where jobname = 'process-scheduled-sends';
--   -- After the next minute tick, inspect run history:
--   select status, return_message, start_time
--     from cron.job_run_details
--     where jobid = (select jobid from cron.job where jobname='process-scheduled-sends')
--     order by start_time desc limit 5;
--
-- TO DISABLE
-- ----------
--   select cron.unschedule('process-scheduled-sends');
-- ============================================================

-- Drop any prior job of this name so re-running reschedules cleanly.
-- cron.unschedule() raises if the job is absent, hence the existence guard.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'process-scheduled-sends') then
    perform cron.unschedule('process-scheduled-sends');
  end if;
end $$;

select cron.schedule(
  'process-scheduled-sends',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://hsdqvlnzorjzxfaqijns.supabase.co/functions/v1/process-scheduled-sends',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb,
    -- Just under the 1-minute cadence. pg_net queues asynchronously, so the
    -- scheduled statement returns immediately regardless of send duration.
    timeout_milliseconds := 55000
  );
  $cron$
);
