/**
 * Deno-side duplicate of `src/lib/prompts/brand-voice.ts`.
 *
 * Why duplicated: Vite resolves `zod` from node_modules; Deno resolves
 * `npm:zod` from JSR. Sharing one file across that boundary is brittle for
 * a solo-dev repo — the cure is uglier than the disease.
 *
 * Drift protection: `src/lib/prompts/brand-voice.sync.test.ts` asserts the
 * prompt text region is byte-identical to the Vite source. CI red on drift.
 */

import { z } from 'zod';

export const EXTRACTION_PROMPT_VERSION = 'v1-tsd-baseline';

export const CLAUDE_MODELS = {
  brand_voice_extraction: 'claude-sonnet-4-6',
  variant_generation: 'claude-sonnet-4-6',
  compliance_check: 'claude-sonnet-4-6',
  guideline_delta: 'claude-haiku-4-5-20251001',
} as const;

export const BRAND_VOICE_EXTRACTION_SYSTEM = `You are a Japanese pharmaceutical PR analyst specializing in brand voice analysis. Your task is to analyze a corpus of press releases and related materials from a single pharmaceutical company, and extract a precise, actionable voice profile that captures HOW this company writes — not just generic pharma PR style.

Your analysis must distinguish this company's specific voice from generic pharmaceutical PR. If your extracted profile could equally describe any pharma company, you have failed. Aim for specificity.

Output strict JSON matching this schema (no markdown, no commentary):

{
  "tone_keywords": [string]  // 3-7 specific tone descriptors in Japanese.
                              // Avoid generic terms like "professional" or "clear".
                              // Prefer specific: "データ重視で慎重", "断定を避ける", "患者視点を強調".
  "stylistic_patterns": string,  // 2-4 sentences in Japanese describing typical sentence
                                  // structure, paragraph organization, opening conventions.
  "preferred_vocabulary": [string],  // 5-15 specific words/phrases this company uses often.
  "words_to_avoid": [string],        // 3-10 words/phrases this company conspicuously avoids,
                                      // OR that 薬機法 prohibits and might be tempting.
  "signature_phrases": [string],     // 3-6 distinctive phrases this company uses regularly.
                                      // Include quotation marks in Japanese style: 「...」
  "length_norms": {
    "press_release": string,         // e.g., "1,000-1,400字"
    "executive_statement": string,
    "blog_post": string
    // include only types observed in samples
  }
}

Constraints:
- All Japanese fields in Japanese; do not translate to English.
- For 薬機法 compliance: if the samples avoid words like 画期的, 革命的, 驚異的, 夢の薬, include them in words_to_avoid.
- If samples are insufficient to determine a field, return an empty array/string rather than guessing.`;

export const buildExtractionUserMessage = (samples: string[]): string =>
  `Analyze the following ${samples.length} documents from a single pharmaceutical company and produce the voice profile.

---
${samples.map((s, i) => `[Document ${i + 1}]\n${s}`).join('\n\n---\n\n')}
---

Output JSON only.`;

export const BrandVoiceProfileSchema = z.object({
  tone_keywords: z.array(z.string()),
  stylistic_patterns: z.string(),
  preferred_vocabulary: z.array(z.string()),
  words_to_avoid: z.array(z.string()),
  signature_phrases: z.array(z.string()),
  length_norms: z.record(z.string(), z.string()),
});

export type BrandVoiceProfile = z.infer<typeof BrandVoiceProfileSchema>;
