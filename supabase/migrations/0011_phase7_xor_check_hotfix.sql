-- ============================================================
-- ClearPress AI — Phase 7 hotfix: XOR check + submit_feedback gate
--
-- Migration 0009 shipped two inverted XOR expressions:
--
--   1. client_feedback CHECK constraint:
--        ((chosen_variant_id is null) <> needs_rework)
--      With <>, the CHECK *accepts* the invalid pairs (both set / both
--      unset) and *rejects* the valid pairs (chosen set xor rework=true).
--
--   2. submit_feedback RPC gate:
--        if (v_chosen is null) = v_needs_rework then RAISE 'chosen_variant_xor_rework_required'
--      This RAISEs on the valid pairs (would-be successes) and lets the
--      invalid pairs through.
--
-- Surfaced at the first real T10 smoke when FeedbackForm.tsx (which
-- mirrors the DB shape) rejected a legitimate variant-pick submission.
--
-- The Edge Function pre-flight at feedback-submit/index.ts is CORRECT
-- (`chosenIsSet === input.needs_rework -> reject`), which is why
-- unit-test coverage on FeedbackSubmitInputSchema (no .refine()) and
-- page render tests didn't catch the bug — neither path exercised
-- actual form submission against the DB.
--
-- This migration:
--   1. Drops and re-adds the CHECK with `=` instead of `<>`.
--   2. CREATE OR REPLACE FUNCTION submit_feedback with the gate flipped
--      to `<>` instead of `=` (same body otherwise; copy-paste from 0009).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix the CHECK constraint
-- ------------------------------------------------------------
alter table public.client_feedback
  drop constraint client_feedback_chosen_xor_rework;

-- Valid pairs satisfy: `chosen is null` and `needs_rework` have the
-- SAME truth value. That sounds counter-intuitive but works out:
--   chosen set,  rework=false: false = false → accept ✓
--   chosen null, rework=true:  true  = true  → accept ✓
--   chosen set,  rework=true:  false = true  → reject ✓
--   chosen null, rework=false: true  = false → reject ✓
alter table public.client_feedback
  add constraint client_feedback_chosen_xor_rework
    check ((chosen_variant_id is null) = needs_rework);

-- ------------------------------------------------------------
-- 2. Fix the submit_feedback RPC gate
-- ------------------------------------------------------------
-- Body is identical to 0009 except for the one line that says
-- `if (v_chosen is null) = v_needs_rework then RAISE` — flipped to
-- `<>` so the RAISE fires on the invalid pairs, not the valid ones.
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

  -- BUGFIX 2026-05-28: was `=`, now `<>`. Raise on the INVALID pairs.
  -- chosen set + rework=true OR chosen null + rework=false both mean
  -- (chosen is null) and needs_rework DIFFER — that's the reject set.
  if (v_chosen is null) <> v_needs_rework then
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

-- Permissions hardening is preserved (no GRANT changes needed — CREATE
-- OR REPLACE FUNCTION keeps existing grants).
