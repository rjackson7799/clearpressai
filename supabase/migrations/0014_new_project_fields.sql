-- ============================================================
-- ClearPress AI — New Project redesign fields
-- Adds the generation-driving levers from the redesigned New Project
-- page onto content_items, and drops the retired variation_axis.
--
--   target_audience       — single "master control" audience (reshapes draft register)
--   drug_lifecycle_status — 薬機法 posture; strict default 'pre_approval' (fails safe)
--   distribution_channel  — target channel (formatting hint), Advanced setting
--   length_tier           — Short/Standard/Long segmented (UI convenience + audit)
--   length_target_chars   — explicit 文字 target (nullable → falls back to sub-type cap)
--   enforce_hard_cap      — when true, generate-variants enforces the target as a ceiling
--   variant_count         — how many variants to generate (1–3)
--
-- variation_axis is removed: the 3-way tone differentiation is now hardcoded
-- to the 'tone' directives inside generate-variants, so the column is dead.
--
-- Apply convention: dashboard SQL editor, then
--   npx supabase migration list --linked      (see local-vs-remote)
--   npx supabase migration repair --status applied <ver> --linked  (only confirmed-applied-but-missing rows)
-- ============================================================

alter table public.content_items
  add column target_audience text not null default 'news_media'
    check (target_audience in ('hcp', 'patient_public', 'investor_ir', 'trade_media', 'news_media')),
  add column drug_lifecycle_status text not null default 'pre_approval'
    check (drug_lifecycle_status in ('pre_approval', 'in_trial', 'approved')),
  add column distribution_channel text not null default 'pr_times'
    check (distribution_channel in ('pr_times', 'corporate_site', 'trade_press', 'wire_service', 'other')),
  add column length_tier text not null default 'standard'
    check (length_tier in ('short', 'standard', 'long')),
  -- nullable: null means "no explicit target, fall back to the sub-type cap".
  add column length_target_chars int
    check (length_target_chars is null or length_target_chars between 100 and 10000),
  add column enforce_hard_cap boolean not null default false,
  add column variant_count int not null default 3
    check (variant_count between 1 and 3);

alter table public.content_items
  drop column variation_axis;
