import { describe, it, expect } from 'vitest';
import vitePromptSrc from './variant-generation.ts?raw';
import edgePromptSrc from '../../../supabase/functions/generate-variants/_prompt.ts?raw';
import { CLAUDE_MODELS } from './variant-generation';

/**
 * Extract a `// drift:start NAME` ... `// drift:end NAME` region's contents.
 * The full region body (including types and function code) is byte-compared
 * across the Vite and Deno copies — H10 audit fix: not just static template
 * fragments, the entire function body.
 */
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
  'VARIATION_DIRECTIVES',
  'VARIANT_GENERATION_SYSTEM',
  'buildVariantUserMessage',
  'parseSubTypeMarker',
] as const;

describe('Variant-generation prompt sync (src vs supabase/functions)', () => {
  for (const region of DRIFT_REGIONS) {
    it(`${region} drift region is byte-identical across both files`, () => {
      const vite = extractDriftRegion(vitePromptSrc, region);
      const edge = extractDriftRegion(edgePromptSrc, region);
      expect(edge).toBe(vite);
    });
  }

  it('VARIANT_GENERATION_PROMPT_VERSION matches across both files', () => {
    expect(
      extractStringLiteral(edgePromptSrc, 'VARIANT_GENERATION_PROMPT_VERSION'),
    ).toBe(
      extractStringLiteral(vitePromptSrc, 'VARIANT_GENERATION_PROMPT_VERSION'),
    );
  });

  it('CLAUDE_MODELS.variant_generation matches the Deno mirror', () => {
    // The Vite-side variant-generation.ts re-exports CLAUDE_MODELS from
    // brand-voice.ts. The brand-voice sync test already proves Vite and
    // extract-voice/_prompt.ts agree. Here we extend coverage to the
    // generate-variants/_prompt.ts copy.
    const edgeRe = /variant_generation:\s*'([^']+)'/;
    const edgeModel = edgePromptSrc.match(edgeRe)?.[1];
    expect(edgeModel).toBeDefined();
    expect(edgeModel).toBe(CLAUDE_MODELS.variant_generation);
  });
});
