import { z } from 'zod';

/**
 * Zod schema mirroring the JSON shape demanded by the extraction prompt
 * in prompts.ts. Used to validate model output and fail loudly when the
 * shape drifts — preferable to silent JSON.parse + later TypeErrors.
 */
export const BrandVoiceProfileSchema = z.object({
  tone_keywords: z.array(z.string()),
  stylistic_patterns: z.string(),
  preferred_vocabulary: z.array(z.string()),
  words_to_avoid: z.array(z.string()),
  signature_phrases: z.array(z.string()),
  length_norms: z.record(z.string(), z.string()),
});

export type BrandVoiceProfile = z.infer<typeof BrandVoiceProfileSchema>;

/**
 * Brief shape for the Phase 0 generation test. Mirrors a subset of the
 * fields the production content_items table will carry (TSD §4.2), so
 * Phase 0 briefs translate cleanly into production briefs later.
 */
export const PhaseZeroBriefSchema = z.object({
  content_type: z.string(),
  free_text: z.string(),
  key_messages: z.array(z.string()).optional(),
  quotes: z
    .array(
      z.object({
        name: z.string(),
        title: z.string(),
        quote: z.string(),
      }),
    )
    .optional(),
  data_points: z.array(z.string()).optional(),
  constraints: z.string().optional(),
});

export type PhaseZeroBriefInput = z.infer<typeof PhaseZeroBriefSchema>;
