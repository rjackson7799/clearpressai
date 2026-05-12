/**
 * Phase 0 prompts. The extraction prompt is copied verbatim from TSD §6.1
 * as the v1 starting point — we iterate from here.
 *
 * Each prompt has a PROMPT_VERSION constant so the run folder can record
 * which version produced which output. Bump the version when you change
 * the prompt text; old runs remain comparable.
 *
 * When Phase 0 concludes "pass," the final version of these prompts moves
 * to src/lib/prompts/brand-voice.ts in the production codebase.
 */

export const EXTRACTION_PROMPT_VERSION = 'v1-tsd-baseline';

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

export const buildExtractionUserMessage = (samples: string[]): string => `Analyze the following ${samples.length} documents from a single pharmaceutical company and produce the voice profile.

---
${samples.map((s, i) => `[Document ${i + 1}]\n${s}`).join('\n\n---\n\n')}
---

Output JSON only.`;

/**
 * Phase 0 generation prompt. This is a SIMPLIFIED version of TSD §6.2's
 * variant-generation system prompt — single output, no variation
 * directive, no guidelines (we have none yet). Purpose: produce one test
 * release using an extracted profile so we can compare to a real held-out
 * release. NOT the production prompt.
 */
export const TEST_GENERATION_PROMPT_VERSION = 'v1-phase0-single-output';

export interface BrandVoiceProfileForPrompt {
  tone_keywords: string[];
  stylistic_patterns: string;
  preferred_vocabulary: string[];
  words_to_avoid: string[];
  signature_phrases: string[];
  length_norms: Record<string, string>;
}

export const buildTestGenerationSystem = (
  profile: BrandVoiceProfileForPrompt,
  contentType: string,
  language: 'ja' | 'en' = 'ja',
): string => {
  const lengthNorm = profile.length_norms[contentType] ?? 'standard';
  return `You are a Japanese pharmaceutical PR writer at a top Tokyo PR firm. You write for one specific client whose voice profile is below. Match this voice precisely.

CLIENT VOICE PROFILE:
- Tone: ${profile.tone_keywords.join(', ')}
- Stylistic patterns: ${profile.stylistic_patterns}
- Preferred vocabulary: ${profile.preferred_vocabulary.join(', ')}
- Words to avoid: ${profile.words_to_avoid.join(', ')}
- Signature phrases (use sparingly when natural): ${profile.signature_phrases.join(', ')}
- Expected length for ${contentType}: ${lengthNorm}

REGULATORY CONSTRAINTS:
- Comply with 薬機法 (Pharmaceutical Affairs Law). Do not use 誇大表現 (exaggerated expressions).
- Forbidden absolute terms: 画期的, 革命的, 驚異的, 夢の, 奇跡, 確実な治療効果, etc.
- All efficacy claims must include statistical context (CI, p-value, sample size) where available.
- Always include required boilerplate: company info, press contact.

LANGUAGE: ${language === 'ja' ? 'Japanese' : 'English'}

Output the press release as plain text. No preamble, no explanation, no markdown headers — just the content as it would appear.`;
};

export interface PhaseZeroBrief {
  content_type: string;
  free_text: string;
  key_messages?: string[];
  quotes?: Array<{ name: string; title: string; quote: string }>;
  data_points?: string[];
  constraints?: string;
}

export const buildTestGenerationUserMessage = (brief: PhaseZeroBrief): string => {
  const parts: string[] = [`[Brief]\n${brief.free_text}`];

  if (brief.key_messages?.length) {
    parts.push(`[Key messages]\n${brief.key_messages.map((m) => `- ${m}`).join('\n')}`);
  }
  if (brief.quotes?.length) {
    parts.push(
      `[Quotes]\n${brief.quotes
        .map((q) => `- ${q.name} (${q.title}): 「${q.quote}」`)
        .join('\n')}`,
    );
  }
  if (brief.data_points?.length) {
    parts.push(`[Data points]\n${brief.data_points.map((d) => `- ${d}`).join('\n')}`);
  }
  if (brief.constraints) {
    parts.push(`[Constraints]\n${brief.constraints}`);
  }

  parts.push(
    `Produce a ${brief.content_type} for this client, matching their voice profile precisely. Plain text only.`,
  );

  return parts.join('\n\n');
};
