import { describe, it, expect } from 'vitest';
// Vite reads both source files as raw strings at test-build time.
// This is the load-bearing drift guard called out in plan T4.
import vitePromptSrc from './brand-voice.ts?raw';
import edgePromptSrc from '../../../supabase/functions/extract-voice/_prompt.ts?raw';

/** Extract the contents of a backtick template-literal assigned to `name`. */
function extractTemplate(src: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*\`([\\s\\S]*?)\`\\s*;`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not locate ${name} in source`);
  return match[1];
}

/** Extract the body of `buildExtractionUserMessage` (everything inside the outer backticks). */
function extractUserMessageBody(src: string): string {
  // The function returns a single template literal. Match the first backtick block
  // following `buildExtractionUserMessage`.
  const re =
    /buildExtractionUserMessage\s*=\s*\([^)]*\)[^=]*=>\s*`([\s\S]*?)`\s*;/;
  const match = src.match(re);
  if (!match) throw new Error('Could not locate buildExtractionUserMessage');
  return match[1];
}

/** Extract a string literal const value (single-quoted) — for version + model pins. */
function extractStringLiteral(src: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*'([^']+)'`);
  const match = src.match(re);
  if (!match) throw new Error(`Could not locate ${name} in source`);
  return match[1];
}

describe('Prompt sync (src vs supabase/functions)', () => {
  it('BRAND_VOICE_EXTRACTION_SYSTEM is byte-identical across both files', () => {
    const vite = extractTemplate(vitePromptSrc, 'BRAND_VOICE_EXTRACTION_SYSTEM');
    const edge = extractTemplate(edgePromptSrc, 'BRAND_VOICE_EXTRACTION_SYSTEM');
    expect(edge).toBe(vite);
  });

  it('buildExtractionUserMessage template body is byte-identical', () => {
    const vite = extractUserMessageBody(vitePromptSrc);
    const edge = extractUserMessageBody(edgePromptSrc);
    expect(edge).toBe(vite);
  });

  it('EXTRACTION_PROMPT_VERSION matches across both files', () => {
    expect(extractStringLiteral(edgePromptSrc, 'EXTRACTION_PROMPT_VERSION')).toBe(
      extractStringLiteral(vitePromptSrc, 'EXTRACTION_PROMPT_VERSION'),
    );
  });

  it('CLAUDE_MODELS.brand_voice_extraction matches across both files', () => {
    const re = /brand_voice_extraction:\s*'([^']+)'/;
    const viteModel = vitePromptSrc.match(re)?.[1];
    const edgeModel = edgePromptSrc.match(re)?.[1];
    expect(viteModel).toBeDefined();
    expect(edgeModel).toBe(viteModel);
  });
});
