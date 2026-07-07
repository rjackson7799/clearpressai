import { describe, it, expect } from 'vitest';
import { newProjectFormSchema } from '@/components/project/NewProjectForm.schema';

const valid = {
  client_id: '00000000-0000-0000-0000-000000000000',
  name: 'Test project',
  content_type: 'press_release',
  content_sub_type: 'auto',
  urgency: 'standard',
  deadline: '',
  language: 'ja',
  target_audience: 'news_media',
  drug_lifecycle_status: 'pre_approval',
  distribution_channel: 'pr_times',
  length_tier: 'standard',
  length_target_chars: 800,
  enforce_hard_cap: false,
  variant_count: 3,
  brief_free_text: 'x'.repeat(60),
  brief_key_messages: [],
  brief_quotes: [],
  brief_data_points: [],
  brief_constraints: '',
} as const;

describe('newProjectFormSchema', () => {
  it('accepts a valid payload', () => {
    expect(newProjectFormSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a null length_target_chars (fall back to sub-type cap)', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, length_target_chars: null })
        .success,
    ).toBe(true);
  });

  it('rejects length_target_chars below the DB minimum (100)', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, length_target_chars: 50 })
        .success,
    ).toBe(false);
  });

  it('rejects length_target_chars above the DB maximum (10000)', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, length_target_chars: 20000 })
        .success,
    ).toBe(false);
  });

  it('rejects variant_count outside 1–3', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, variant_count: 4 }).success,
    ).toBe(false);
    expect(
      newProjectFormSchema.safeParse({ ...valid, variant_count: 0 }).success,
    ).toBe(false);
  });

  it('rejects an unknown target_audience', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, target_audience: 'aliens' })
        .success,
    ).toBe(false);
  });

  it('rejects a brief shorter than 50 characters', () => {
    expect(
      newProjectFormSchema.safeParse({ ...valid, brief_free_text: 'short' })
        .success,
    ).toBe(false);
  });
});
