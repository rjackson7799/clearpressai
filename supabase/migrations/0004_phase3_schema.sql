-- ============================================================
-- ClearPress AI — Phase 3 schema
-- 1. content_items.content_sub_type — carry brief-time sub-type
--    choice through to the generate-variants Edge Function.
-- 2. project_summary view — fast read model for ProjectsListPage.
-- 3. regenerate_variant(...) — atomic clear-findings + upsert RPC.
-- ============================================================

-- 1. Sub-type carry from brief to generator
alter table public.content_items
  add column content_sub_type text not null default 'auto'
  check (content_sub_type in ('auto', 'full_clinical', 'partner_ack', 'csr_event', 'business_news'));

-- 2. Project summary view (ProjectsListPage)
-- security_invoker = on so underlying-table RLS still gates access through the view.
create view public.project_summary
  with (security_invoker = on)
  as
select
  p.id,
  p.name,
  p.status,
  p.urgency,
  p.deadline,
  p.created_at,
  c.id   as client_id,
  c.name as client_name,
  ci.id                as content_item_id,
  ci.content_type,
  ci.content_sub_type,
  count(distinct cv.id) filter (where cv.internal_approved) as variants_approved,
  count(distinct cv.id) as variants_total,
  max(cv.updated_at) as last_generated_at
from public.projects p
left join public.clients c          on c.id  = p.client_id
left join public.content_items ci   on ci.project_id = p.id
left join public.content_variants cv on cv.content_item_id = ci.id
group by p.id, c.id, c.name, ci.id, ci.content_type, ci.content_sub_type;

-- 3. Atomic regenerate function
-- security invoker => respects the caller's RLS context.
-- Clears any existing compliance_findings for the variant slot, then upserts
-- the variant row (on (content_item_id, variant_index)) within one transaction.
create or replace function public.regenerate_variant(
  p_content_item_id uuid,
  p_variant_index int,
  p_variant_label text,
  p_body_text text,
  p_char_count int,
  p_reading_time_seconds int,
  p_model_used text,
  p_generation_params jsonb
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

  return v_row;
end;
$$;

grant execute on function public.regenerate_variant(
  uuid, int, text, text, int, int, text, jsonb
) to authenticated;
