import { describe, it, expect } from 'vitest';
import { explainFeedbackError } from '@/lib/feedback-errors';

describe('explainFeedbackError', () => {
  it('maps token_invalid to its bilingual pair', () => {
    const result = explainFeedbackError('token_invalid');
    expect(result.ja).toContain('リンク');
    expect(result.en.toLowerCase()).toContain('link');
  });

  it('maps network_error to its bilingual pair', () => {
    const result = explainFeedbackError('network_error');
    expect(result.ja).toContain('ネットワーク');
    expect(result.en.toLowerCase()).toContain('network');
  });

  it('matches a substring (FunctionsHttpError wraps the raw code)', () => {
    const result = explainFeedbackError('Error: token_invalid');
    expect(result.ja).toContain('リンク');
  });

  it('returns the generic fallback on an unknown code (never null)', () => {
    const result = explainFeedbackError('totally_made_up_gate');
    expect(result).not.toBeNull();
    expect(result.ja.length).toBeGreaterThan(0);
    expect(result.en.length).toBeGreaterThan(0);
  });

  it('generic fallback differs from the token_invalid mapping', () => {
    const fallback = explainFeedbackError('totally_made_up_gate');
    const tokenInvalid = explainFeedbackError('token_invalid');
    expect(fallback.ja).not.toBe(tokenInvalid.ja);
  });
});
