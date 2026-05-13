import { describe, it, expect } from 'vitest';
import azProfile from '../../../prototypes/brand-voice-extraction/phase0-closeout/az-profile.json';
import chugaiProfile from '../../../prototypes/brand-voice-extraction/phase0-closeout/chugai-profile.json';
import {
  BrandVoiceProfileSchema,
  EXTRACTION_PROMPT_VERSION,
  CLAUDE_MODELS,
  BRAND_VOICE_EXTRACTION_SYSTEM,
  buildExtractionUserMessage,
} from './brand-voice';

describe('BrandVoiceProfileSchema', () => {
  it('accepts the real AstraZeneca JP profile from Phase 0 closeout', () => {
    const parsed = BrandVoiceProfileSchema.parse(azProfile);
    expect(parsed.tone_keywords.length).toBeGreaterThanOrEqual(3);
    expect(parsed.stylistic_patterns.length).toBeGreaterThan(0);
    expect(Object.keys(parsed.length_norms)).toContain('press_release');
  });

  it('accepts the Chugai profile from Phase 0 closeout', () => {
    expect(() => BrandVoiceProfileSchema.parse(chugaiProfile)).not.toThrow();
  });

  it('rejects output missing required fields', () => {
    expect(() =>
      BrandVoiceProfileSchema.parse({ tone_keywords: ['x'] }),
    ).toThrow();
  });
});

describe('Prompt constants', () => {
  it('pins EXTRACTION_PROMPT_VERSION to v1-tsd-baseline (the Phase 0 graduated prompt)', () => {
    expect(EXTRACTION_PROMPT_VERSION).toBe('v1-tsd-baseline');
  });

  it('pins brand_voice_extraction model to claude-sonnet-4-6 per TSD §2.3', () => {
    expect(CLAUDE_MODELS.brand_voice_extraction).toBe('claude-sonnet-4-6');
  });

  it('builds a user message that embeds N documents with index labels', () => {
    const msg = buildExtractionUserMessage(['alpha', 'beta', 'gamma']);
    expect(msg).toContain('[Document 1]');
    expect(msg).toContain('[Document 3]');
    expect(msg).toContain('alpha');
    expect(msg).toContain('gamma');
  });

  it('system prompt mentions 薬機法 compliance (regulatory anchor)', () => {
    expect(BRAND_VOICE_EXTRACTION_SYSTEM).toContain('薬機法');
  });
});
