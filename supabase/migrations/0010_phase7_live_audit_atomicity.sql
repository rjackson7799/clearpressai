-- ============================================================
-- ClearPress AI — Phase 7 polish: live audit-event atomicity
-- Reference: CLAUDE.md "Phase 4/5/6 carry-forward → Live audit-event
--   idempotence guard for variant_generated + compliance_checked".
--
-- Closes the I4 gap left by Phases 3/4: the Edge Functions used to call
-- regenerate_variant / direct findings inserts THEN write the audit event
-- as a follow-up. A retry after partial failure (domain write OK, audit
-- insert failed) could produce duplicate audit events. Migration 0008
-- closed this for delivery_sent (audit inside mark_delivery_sent_*);
-- migration 0009 closed it for feedback_received + voice_updated.
-- This migration closes the last two live events.
-- ============================================================

-- ------------------------------------------------------------
-- 1. regenerate_variant: extended with audit params
-- ------------------------------------------------------------
-- Adds 4 audit params at the END of the signature so positional callers
-- migrating from the old shape get a compile/runtime error (RPC arity
-- mismatch) rather than silently dropping audit emission. Edge Function
-- updated in the same Phase 7 commit.
--
-- Drops the v1 signature explicitly so the new function with the new
-- parameter list cleanly replaces it (PostgreSQL distinguishes functions
-- by signature, so a CREATE OR REPLACE with a different signature would
-- create a second function with the same name — confusing).
drop function if exists public.regenerate_variant(
  uuid, int, text, text, int, int, text, jsonb
);

create or replace function public.regenerate_variant(
  p_content_item_id uuid,
  p_variant_index int,
  p_variant_label text,
  p_body_text text,
  p_char_count int,
  p_reading_time_seconds int,
  p_model_used text,
  p_generation_params jsonb,
  -- Phase 7 audit params (atomic emission inside the same tx)
  p_project_id uuid,
  p_actor_id uuid,
  p_actor_name_snapshot text,
  p_audit_details jsonb
) returns public.content_variants
language plpgsql
security invoker
as $$
declare
  v_row public.content_variants;
  v_existing_id uuid;
begin
  select id into v_existing_id
  from public.content_variants
  where content_item_id = p_content_item_id and variant_index = p_variant_index;

  if v_existing_id is not null then
    delete from public.compliance_findings where variant_id = v_existing_id;
  end if;

  insert into public.content_variants (
    content_item_id, variant_index, variant_label, body_text,
    char_count, reading_time_seconds, model_used, generation_params,
    internal_approved, internal_approved_by, internal_approved_at,
    updated_at
  ) values (
    p_content_item_id, p_variant_index, p_variant_label, p_body_text,
    p_char_count, p_reading_time_seconds, p_model_used, p_generation_params,
    false, null, null,
    now()
  )
  on conflict (content_item_id, variant_index) do update set
    variant_label = excluded.variant_label,
    body_text = excluded.body_text,
    char_count = excluded.char_count,
    reading_time_seconds = excluded.reading_time_seconds,
    model_used = excluded.model_used,
    generation_params = excluded.generation_params,
    internal_approved = false,
    internal_approved_by = null,
    internal_approved_at = null,
    updated_at = now()
  returning * into v_row;

  -- I4 atomicity: emit the variant_generated audit event in the same tx
  -- as the variant upsert. The audit_trail_events row carries the
  -- newly-minted variant_id (from v_row.id) so the trail is 1:1 with
  -- the row, not the Edge Function call.
  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id,
     actor_name_snapshot, details, model_used)
  values (
    p_project_id,
    null,
    'variant_generated',
    case when p_actor_id is null then 'system' else 'user' end,
    p_actor_id,
    p_actor_name_snapshot,
    p_audit_details || jsonb_build_object('variant_id', v_row.id),
    p_model_used
  );

  return v_row;
end;
$$;

grant execute on function public.regenerate_variant(
  uuid, int, text, text, int, int, text, jsonb,
  uuid, uuid, text, jsonb
) to authenticated;

-- ------------------------------------------------------------
-- 2. record_compliance_check: new RPC for compliance findings + audit
-- ------------------------------------------------------------
-- Wraps the delete-prior-then-insert-new findings cycle plus emits the
-- compliance_checked / compliance_rechecked audit event, all in one tx.
-- Event type is determined server-side based on whether any prior
-- findings existed (rechecked) vs. none (checked).
--
-- Returns a jsonb envelope so the Edge Function can relay inserted
-- finding rows to its caller without a follow-up SELECT.
create or replace function public.record_compliance_check(
  p_variant_id uuid,
  p_project_id uuid,
  p_findings jsonb,        -- jsonb array of rows to insert (no variant_id field — set here)
  p_audit_details jsonb,   -- caller-side counts + run metadata, merged with server-derived fields
  p_model_used text
) returns jsonb
language plpgsql
security invoker
as $$
declare
  v_prior_count int;
  v_event_type text;
  v_inserted jsonb;
begin
  select count(*) into v_prior_count
    from public.compliance_findings
   where variant_id = p_variant_id;

  delete from public.compliance_findings where variant_id = p_variant_id;

  if jsonb_array_length(coalesce(p_findings, '[]'::jsonb)) > 0 then
    with ins as (
      insert into public.compliance_findings
        (variant_id, severity, source_text, paragraph_index, explanation,
         regulation_reference, suggested_correction, resolution_status)
      select
        p_variant_id,
        (f->>'severity'),
        (f->>'source_text'),
        coalesce((f->>'paragraph_index')::int, 1),
        (f->>'explanation'),
        (f->>'regulation_reference'),
        nullif(f->>'suggested_correction', ''),
        'unresolved'
      from jsonb_array_elements(p_findings) f
      returning severity, source_text, paragraph_index, explanation,
                regulation_reference, suggested_correction
    )
    select coalesce(jsonb_agg(to_jsonb(ins.*)), '[]'::jsonb)
      into v_inserted
      from ins;
  else
    v_inserted := '[]'::jsonb;
  end if;

  v_event_type := case when v_prior_count > 0
                       then 'compliance_rechecked'
                       else 'compliance_checked' end;

  insert into public.audit_trail_events
    (project_id, audit_report_id, event_type, actor_type, actor_id,
     actor_name_snapshot, details, model_used)
  values (
    p_project_id,
    null,
    v_event_type,
    'system',
    null,
    null,
    p_audit_details
      || jsonb_build_object(
        'variant_id', p_variant_id,
        'prior_findings_cleared', v_prior_count
      ),
    p_model_used
  );

  return jsonb_build_object(
    'prior_findings_count', v_prior_count,
    'event_type', v_event_type,
    'inserted_findings', v_inserted
  );
end;
$$;

grant execute on function public.record_compliance_check(
  uuid, uuid, jsonb, jsonb, text
) to authenticated;
