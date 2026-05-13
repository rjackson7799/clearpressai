-- ============================================================
-- ClearPress AI — Phase 2 T1.5
-- Align brand_voice_profiles with extraction prompt output and re-extraction UX:
--   * add user_edited (gate manual-edit-loss confirm dialog)
--   * add last_extracted_at (display "last extracted: ..." timestamp)
--   * convert stylistic_patterns jsonb -> text (prompt produces a single string)
-- ============================================================

alter table public.brand_voice_profiles
  add column user_edited boolean not null default false,
  add column last_extracted_at timestamptz;

-- stylistic_patterns: prompt produces a string; storing as jsonb forces JSON-encoded strings.
-- Convert to text. Existing rows in dev have empty default '[]' which becomes ''.
alter table public.brand_voice_profiles
  alter column stylistic_patterns drop default,
  alter column stylistic_patterns type text using (
    case
      when stylistic_patterns is null then null
      when jsonb_typeof(stylistic_patterns) = 'string' then stylistic_patterns #>> '{}'
      else ''
    end
  ),
  alter column stylistic_patterns set default '';
