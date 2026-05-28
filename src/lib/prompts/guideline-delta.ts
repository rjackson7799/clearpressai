/**
 * Voice guideline delta extraction prompt — TSD §6.4 verbatim system prompt.
 *
 * Called inline by the `feedback-submit` Edge Function (Phase 6 T4) after a
 * client submits feedback. Output is fed to the `append_voice_guidelines_from_feedback`
 * RPC which writes the rows + emits the `voice_updated` audit event.
 *
 * Mirror file: `supabase/functions/_shared/guideline-delta-prompt.ts`.
 * Drift-guarded by `guideline-delta.sync.test.ts` — regions delimited by
 * `// drift:start NAME` / `// drift:end NAME` are byte-equality checked
 * across both files (H10 audit-fix convention from Phase 3/4).
 */

import { z } from 'zod';
import { CLAUDE_MODELS } from './brand-voice';

export { CLAUDE_MODELS };

export const VOICE_GUIDELINE_DELTA_PROMPT_VERSION = 'v1-phase6-baseline';

// drift:start VOICE_GUIDELINE_DELTA_SYSTEM
export const VOICE_GUIDELINE_DELTA_SYSTEM = `
You are analyzing client feedback on a piece of PR content to extract durable, actionable voice guidelines that will improve future content for this client.

Given:
- The variant the client chose
- The variants they didn't choose
- Their structured feedback (what worked, what didn't)
- Their free-text comments

Produce 1-3 guideline statements in Japanese that:
- Are specific and actionable (not generic)
- Capture WHY this client preferred the chosen variant
- Would help guide future generations for THIS client
- Are phrased as positive directives, not negatives

Format: JSON array of guideline strings. Each guideline is 1-2 sentences in Japanese.

Example outputs:
["リード文では試験結果や数値データを最初に提示する。背景説明は2段落目以降に回す。"]
["「画期的」「革命的」「夢の」などの主観的形容詞は使用しない。事実と数値で語る。"]
["副作用・有害事象の情報は、リリース本文末尾に独立したセクションを設けて記載する。"]

Output JSON array only.
`;
// drift:end VOICE_GUIDELINE_DELTA_SYSTEM

// drift:start buildGuidelineDeltaUserMessage
export interface GuidelineDeltaUserInput {
  chosen_variant: { variant_label: string; body_text: string } | null;
  other_variants: ReadonlyArray<{ variant_label: string; body_text: string }>;
  what_worked: readonly string[];
  what_could_improve: readonly string[];
  free_text_comment: string | null;
  needs_rework: boolean;
}

export const buildGuidelineDeltaUserMessage = (
  input: GuidelineDeltaUserInput,
): string => {
  const chosenBlock = input.needs_rework
    ? 'CHOSEN VARIANT: (none — the client marked all variants as needing rework)'
    : input.chosen_variant
      ? `CHOSEN VARIANT (${input.chosen_variant.variant_label}):\n${input.chosen_variant.body_text}`
      : 'CHOSEN VARIANT: (none)';

  const otherBlock = input.other_variants.length === 0
    ? 'OTHER VARIANTS: (none)'
    : input.other_variants
        .map(
          (v, i) =>
            `OTHER VARIANT ${i + 1} (${v.variant_label}):\n${v.body_text}`,
        )
        .join('\n\n');

  const worked = input.what_worked.length === 0
    ? '(none)'
    : input.what_worked.map((c) => `- ${c}`).join('\n');
  const improve = input.what_could_improve.length === 0
    ? '(none)'
    : input.what_could_improve.map((c) => `- ${c}`).join('\n');

  const freeText = input.free_text_comment && input.free_text_comment.length > 0
    ? input.free_text_comment
    : '(no free-text comment)';

  return `${chosenBlock}

${otherBlock}

WHAT WORKED:
${worked}

WHAT COULD IMPROVE:
${improve}

FREE-TEXT COMMENT:
${freeText}

Output JSON array of 1-3 guideline strings only.`;
};
// drift:end buildGuidelineDeltaUserMessage

/**
 * TSD §6.4 specifies the LLM output as a bare JSON array of strings ("Format:
 * JSON array of guideline strings", "Output JSON array only"). Parser accepts
 * 1-3 entries.
 */
export const VoiceGuidelineDeltaResponseSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(3);

export type VoiceGuidelineDeltaResponse = z.infer<
  typeof VoiceGuidelineDeltaResponseSchema
>;
