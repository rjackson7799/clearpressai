import { describe, it, expect } from 'vitest';
import tsSrc from '../lib/types/feedback.ts?raw';
import denoSrc from '../../supabase/functions/_shared/types-feedback.ts?raw';
import {
  FeedbackSubmitInputSchema,
  FeedbackSubmitResponseSchema,
  FeedbackLoadResponseSchema,
} from '../lib/types/feedback';

function extractDriftRegion(src: string, name: string): string {
  const re = new RegExp(
    `// drift:start ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// drift:end ${name}`,
  );
  const match = src.match(re);
  if (!match) {
    throw new Error(`Could not locate drift region "${name}" in source`);
  }
  return match[1];
}

describe('feedback types drift (TS mirror vs Deno _shared/types-feedback)', () => {
  it('FEEDBACK_TYPES region is byte-identical across both files', () => {
    const ts = extractDriftRegion(tsSrc, 'FEEDBACK_TYPES');
    const deno = extractDriftRegion(denoSrc, 'FEEDBACK_TYPES');
    expect(deno).toBe(ts);
  });
});

const validToken = 'a'.repeat(43);

describe('FeedbackSubmitInputSchema', () => {
  const baseInput = {
    token: validToken,
    chosen_variant_id: '33333333-3333-4333-8333-333333333333',
    what_worked: ['voice_match', 'clarity'],
    what_could_improve: ['tone'],
    needs_rework: false,
    free_text_comment: 'Looks good.',
  };

  it('accepts a minimal valid input', () => {
    expect(() => FeedbackSubmitInputSchema.parse(baseInput)).not.toThrow();
  });

  it('accepts needs_rework=true with null chosen_variant_id', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({
        ...baseInput,
        chosen_variant_id: null,
        needs_rework: true,
      }),
    ).not.toThrow();
  });

  it('rejects token shorter than 43 chars', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({ ...baseInput, token: 'a'.repeat(42) }),
    ).toThrow();
  });

  it('rejects token longer than 43 chars', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({ ...baseInput, token: 'a'.repeat(44) }),
    ).toThrow();
  });

  it('rejects token with disallowed characters', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({
        ...baseInput,
        token: '!'.repeat(43),
      }),
    ).toThrow();
  });

  it('rejects more than 6 chips in what_worked', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({
        ...baseInput,
        what_worked: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      }),
    ).toThrow();
  });

  it('rejects a chip longer than 50 chars', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({
        ...baseInput,
        what_worked: ['x'.repeat(51)],
      }),
    ).toThrow();
  });

  it('rejects free_text_comment longer than 2000 chars', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({
        ...baseInput,
        free_text_comment: 'x'.repeat(2001),
      }),
    ).toThrow();
  });

  it('accepts null free_text_comment', () => {
    expect(() =>
      FeedbackSubmitInputSchema.parse({ ...baseInput, free_text_comment: null }),
    ).not.toThrow();
  });
});

describe('FeedbackSubmitResponseSchema', () => {
  it('accepts a first-write success', () => {
    expect(() =>
      FeedbackSubmitResponseSchema.parse({
        ok: true,
        status: 'submitted',
        delta_status: 'succeeded',
      }),
    ).not.toThrow();
  });

  it('accepts an idempotent-replay response with delta_status=skipped', () => {
    expect(() =>
      FeedbackSubmitResponseSchema.parse({
        ok: true,
        status: 'already_submitted',
        delta_status: 'skipped',
      }),
    ).not.toThrow();
  });

  it('accepts a first-write with LLM failure', () => {
    expect(() =>
      FeedbackSubmitResponseSchema.parse({
        ok: true,
        status: 'submitted',
        delta_status: 'failed',
      }),
    ).not.toThrow();
  });
});

describe('FeedbackLoadResponseSchema (discriminated union)', () => {
  const okFixture = {
    status: 'ok' as const,
    delivery: {
      subject: 'Press release',
      recipient_name: 'Client Co',
      sent_at: '2026-05-13T10:00:00.000Z',
      audit_report_version: '1.0',
    },
    project: { name: 'Q1 Press' },
    content_item: { content_sub_type: 'partner_ack' as const },
    variants: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        variant_label: 'Concise',
        variant_index: 1 as const,
        body_html: '<p>x</p>',
        body_text: 'x',
        variation_directive: null,
        char_count: 100,
      },
    ],
    recommended_variant_id: null,
    sender: { from_name: 'ClearPress' },
    expires_at: '2026-06-13T10:00:00.000Z',
  };

  it('accepts the ok branch with sender.from_name', () => {
    expect(() => FeedbackLoadResponseSchema.parse(okFixture)).not.toThrow();
  });

  it('rejects the ok branch when sender.from_name is missing', () => {
    const noSender = { ...okFixture, sender: {} };
    expect(() => FeedbackLoadResponseSchema.parse(noSender)).toThrow();
  });

  it('accepts the already_submitted branch', () => {
    expect(() =>
      FeedbackLoadResponseSchema.parse({
        status: 'already_submitted',
        submitted_at: '2026-05-14T10:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('accepts the invalid branch', () => {
    expect(() =>
      FeedbackLoadResponseSchema.parse({ status: 'invalid' }),
    ).not.toThrow();
  });

  it('rejects an unknown status value', () => {
    expect(() =>
      FeedbackLoadResponseSchema.parse({ status: 'something_else' }),
    ).toThrow();
  });
});
