import { describe, it, expect } from 'vitest';
import {
  VARIANT_GENERATION_SYSTEM,
  exceedsHardCap,
  type VariantSystemArgs,
} from './variant-generation';

const baseArgs = (over: Partial<VariantSystemArgs> = {}): VariantSystemArgs => ({
  voiceProfile: {
    tone_keywords: ['誠実'],
    stylistic_patterns: 'formal',
    preferred_vocabulary: [],
    words_to_avoid: [],
    signature_phrases: [],
    length_norms: {},
  },
  guidelines: [],
  contentType: 'press_release',
  subType: 'auto',
  language: 'ja',
  audience: 'news_media',
  lifecycle: 'approved',
  channel: 'pr_times',
  lengthTargetChars: null,
  enforceHardCap: false,
  ...over,
});

// These assert the levers actually reach the assembled prompt — the sync test
// only proves the two copies match, not that the wiring does anything.
describe('VARIANT_GENERATION_SYSTEM lever wiring', () => {
  it('injects audience instructions (patient_public → plain language / no jargon)', () => {
    const out = VARIANT_GENERATION_SYSTEM(
      baseArgs({ audience: 'patient_public' }),
    );
    expect(out).toContain('TARGET AUDIENCE');
    expect(out).toMatch(/plain language/i);
    expect(out).toMatch(/jargon/i);
  });

  it('injects hcp-specific instructions distinct from patient_public', () => {
    const out = VARIANT_GENERATION_SYSTEM(baseArgs({ audience: 'hcp' }));
    expect(out).toMatch(/clinical terminology/i);
  });

  it('pre_approval posture forbids efficacy/safety claims', () => {
    const out = VARIANT_GENERATION_SYSTEM(
      baseArgs({ lifecycle: 'pre_approval' }),
    );
    expect(out).toContain('REGULATORY POSTURE');
    expect(out).toMatch(/PRE-APPROVAL/);
    expect(out).toMatch(/efficacy or safety/i);
  });

  it('approved posture permits approved-indication claims and drops the investigational-only framing', () => {
    const out = VARIANT_GENERATION_SYSTEM(baseArgs({ lifecycle: 'approved' }));
    expect(out).toMatch(/approved-indication/i);
    expect(out).not.toMatch(/investigational framing/i);
  });

  it('injects the distribution channel note', () => {
    const out = VARIANT_GENERATION_SYSTEM(baseArgs({ channel: 'pr_times' }));
    expect(out).toContain('DISTRIBUTION CHANNEL');
    expect(out).toMatch(/PR TIMES/);
  });

  it('adds a HARD CAP length instruction when enforced', () => {
    const out = VARIANT_GENERATION_SYSTEM(
      baseArgs({ lengthTargetChars: 800, enforceHardCap: true }),
    );
    expect(out).toMatch(/HARD CAP/);
    expect(out).toContain('800字');
  });

  it('adds a soft target (no HARD CAP) when a target is set without enforcement', () => {
    const out = VARIANT_GENERATION_SYSTEM(
      baseArgs({ lengthTargetChars: 800, enforceHardCap: false }),
    );
    expect(out).toMatch(/EXPLICIT LENGTH TARGET/);
    expect(out).not.toMatch(/HARD CAP/);
  });

  it('omits the length-target block when no target is set', () => {
    const out = VARIANT_GENERATION_SYSTEM(baseArgs({ lengthTargetChars: null }));
    expect(out).not.toMatch(/EXPLICIT LENGTH TARGET/);
  });
});

describe('exceedsHardCap (enforce → retry → error decision)', () => {
  it('never violates when enforcement is off', () => {
    expect(
      exceedsHardCap({
        charCount: 2000,
        lengthTargetChars: 800,
        enforceHardCap: false,
      }),
    ).toBe(false);
  });

  it('never violates when there is no target', () => {
    expect(
      exceedsHardCap({
        charCount: 2000,
        lengthTargetChars: null,
        enforceHardCap: true,
      }),
    ).toBe(false);
  });

  it('violates when over the target and enforced', () => {
    expect(
      exceedsHardCap({
        charCount: 900,
        lengthTargetChars: 800,
        enforceHardCap: true,
      }),
    ).toBe(true);
  });

  it('does not violate at or under the target', () => {
    expect(
      exceedsHardCap({
        charCount: 800,
        lengthTargetChars: 800,
        enforceHardCap: true,
      }),
    ).toBe(false);
  });
});
