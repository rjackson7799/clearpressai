import { describe, it, expect } from 'vitest';
import vitePromptSrc from './guideline-delta.ts?raw';
import edgePromptSrc from '../../../supabase/functions/_shared/guideline-delta-prompt.ts?raw';
import {
  CLAUDE_MODELS,
  VoiceGuidelineDeltaResponseSchema,
  buildGuidelineDeltaUserMessage,
} from './guideline-delta';

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

function extractStringLiteral(src: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*'([^']+)'`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not locate ${name} in source`);
  return match[1];
}

const DRIFT_REGIONS = [
  'VOICE_GUIDELINE_DELTA_SYSTEM',
  'buildGuidelineDeltaUserMessage',
] as const;

describe('Voice guideline delta prompt sync (src vs supabase/functions)', () => {
  for (const region of DRIFT_REGIONS) {
    it(`${region} drift region is byte-identical across both files`, () => {
      const vite = extractDriftRegion(vitePromptSrc, region);
      const edge = extractDriftRegion(edgePromptSrc, region);
      expect(edge).toBe(vite);
    });
  }

  it('VOICE_GUIDELINE_DELTA_PROMPT_VERSION matches across both files', () => {
    expect(
      extractStringLiteral(edgePromptSrc, 'VOICE_GUIDELINE_DELTA_PROMPT_VERSION'),
    ).toBe(
      extractStringLiteral(vitePromptSrc, 'VOICE_GUIDELINE_DELTA_PROMPT_VERSION'),
    );
  });

  it('CLAUDE_MODELS.guideline_delta matches the Deno mirror', () => {
    const edgeRe = /guideline_delta:\s*'([^']+)'/;
    const edgeModel = edgePromptSrc.match(edgeRe)?.[1];
    expect(edgeModel).toBeDefined();
    expect(edgeModel).toBe(CLAUDE_MODELS.guideline_delta);
  });
});

describe('VoiceGuidelineDeltaResponseSchema (zod shape)', () => {
  it('accepts a single guideline string', () => {
    expect(() =>
      VoiceGuidelineDeltaResponseSchema.parse(['リード文は数値データから。']),
    ).not.toThrow();
  });

  it('accepts the maximum 3 guidelines', () => {
    expect(() =>
      VoiceGuidelineDeltaResponseSchema.parse(['a', 'b', 'c']),
    ).not.toThrow();
  });

  it('rejects an empty array (min 1)', () => {
    expect(() => VoiceGuidelineDeltaResponseSchema.parse([])).toThrow();
  });

  it('rejects more than 3 guidelines', () => {
    expect(() =>
      VoiceGuidelineDeltaResponseSchema.parse(['a', 'b', 'c', 'd']),
    ).toThrow();
  });

  it('rejects empty-string entries', () => {
    expect(() => VoiceGuidelineDeltaResponseSchema.parse([''])).toThrow();
  });
});

describe('buildGuidelineDeltaUserMessage', () => {
  it('formats the chosen-variant case', () => {
    const msg = buildGuidelineDeltaUserMessage({
      chosen_variant: { variant_label: 'Concise', body_text: 'Body A' },
      other_variants: [
        { variant_label: 'Detailed', body_text: 'Body B' },
        { variant_label: 'Accessible', body_text: 'Body C' },
      ],
      what_worked: ['voice_match', 'clarity'],
      what_could_improve: ['tone'],
      free_text_comment: 'Loved the lead.',
      needs_rework: false,
    });
    expect(msg).toContain('CHOSEN VARIANT (Concise)');
    expect(msg).toContain('Body A');
    expect(msg).toContain('OTHER VARIANT 1 (Detailed)');
    expect(msg).toContain('OTHER VARIANT 2 (Accessible)');
    expect(msg).toContain('- voice_match');
    expect(msg).toContain('- clarity');
    expect(msg).toContain('- tone');
    expect(msg).toContain('Loved the lead.');
  });

  it('uses the needs-rework framing when needs_rework is true', () => {
    const msg = buildGuidelineDeltaUserMessage({
      chosen_variant: null,
      other_variants: [
        { variant_label: 'A', body_text: 'a' },
        { variant_label: 'B', body_text: 'b' },
        { variant_label: 'C', body_text: 'c' },
      ],
      what_worked: [],
      what_could_improve: ['tone'],
      free_text_comment: null,
      needs_rework: true,
    });
    expect(msg).toContain(
      'CHOSEN VARIANT: (none — the client marked all variants as needing rework)',
    );
    expect(msg).toContain('WHAT WORKED:\n(none)');
    expect(msg).toContain('FREE-TEXT COMMENT:\n(no free-text comment)');
  });
});
