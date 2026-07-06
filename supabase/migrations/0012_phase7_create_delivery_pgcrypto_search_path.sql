-- Phase 7 hotfix: create_delivery mints feedback tokens with
-- gen_random_bytes(32), which lives in the extensions schema on Supabase.
-- The RPC was created with search_path=public, so production sends failed
-- with "function gen_random_bytes(integer) does not exist".
alter function public.create_delivery(jsonb, timestamptz)
  set search_path = public, extensions;
