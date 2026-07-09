import { describe, it, expect } from 'vitest';
import {
  INTERNAL_FEEDBACK_TYPES,
  INTERNAL_FEEDBACK_STATUSES,
  INTERNAL_FEEDBACK_TYPE_LABELS,
  INTERNAL_FEEDBACK_STATUS_LABELS,
  INTERNAL_FEEDBACK_TYPE_VARIANT,
  INTERNAL_FEEDBACK_STATUS_VARIANT,
  feedbackTypeLabel,
  feedbackStatusLabel,
} from './internal-feedback';

const BADGE_VARIANTS = ['default', 'secondary', 'outline', 'destructive'];

describe('internal-feedback label + variant maps', () => {
  it('covers every type with a non-empty bilingual label and a valid variant', () => {
    for (const t of INTERNAL_FEEDBACK_TYPES) {
      const label = INTERNAL_FEEDBACK_TYPE_LABELS[t];
      expect(label.ja.length).toBeGreaterThan(0);
      expect(label.en.length).toBeGreaterThan(0);
      expect(BADGE_VARIANTS).toContain(INTERNAL_FEEDBACK_TYPE_VARIANT[t]);
    }
  });

  it('covers every status with a non-empty bilingual label and a valid variant', () => {
    for (const s of INTERNAL_FEEDBACK_STATUSES) {
      const label = INTERNAL_FEEDBACK_STATUS_LABELS[s];
      expect(label.ja.length).toBeGreaterThan(0);
      expect(label.en.length).toBeGreaterThan(0);
      expect(BADGE_VARIANTS).toContain(INTERNAL_FEEDBACK_STATUS_VARIANT[s]);
    }
  });

  it('exposes the canonical type and status lists', () => {
    expect([...INTERNAL_FEEDBACK_TYPES]).toEqual(['bug', 'feature', 'improvement']);
    expect([...INTERNAL_FEEDBACK_STATUSES]).toEqual([
      'pending',
      'in_progress',
      'completed',
    ]);
  });
});

describe('label lookups', () => {
  it('returns the mapped label for a known status', () => {
    expect(feedbackStatusLabel('completed').en).toBe('Completed');
  });

  it('falls back to the raw value for an unknown status', () => {
    expect(feedbackStatusLabel('archived')).toEqual({
      ja: 'archived',
      en: 'archived',
    });
  });

  it('returns a dash for null/undefined', () => {
    expect(feedbackStatusLabel(null)).toEqual({ ja: '—', en: '—' });
    expect(feedbackTypeLabel(undefined)).toEqual({ ja: '—', en: '—' });
  });
});
