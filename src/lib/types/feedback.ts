/**
 * TS mirror of supabase/functions/_shared/types-feedback.ts. The Deno copy is
 * authoritative for the feedback-submit Edge Function (input parsing) and the
 * feedback-load Edge Function (response emission). This mirror is for: the
 * FeedbackPage RHF form schema, the useFeedbackSubmit / useFeedbackLoad
 * client hooks, and the vitest drift guard in
 * src/__tests__/feedback-types.drift.test.ts.
 *
 * SnapshotVariantSchema + ContentSubTypeSchema are reused from delivery.ts —
 * the OK branch of FeedbackLoadResponseSchema is layered on top of those
 * already-drift-guarded primitives, so only the new shapes go in the
 * FEEDBACK_TYPES region.
 */
import { z } from 'zod';
import { SnapshotVariantSchema, ContentSubTypeSchema } from './delivery';

// drift:start FEEDBACK_TYPES
const TOKEN_REGEX = /^[A-Za-z0-9_-]{43}$/;

export const FeedbackSubmitInputSchema = z.object({
  token: z
    .string()
    .refine((v) => TOKEN_REGEX.test(v), { message: 'invalid_token_format' }),
  chosen_variant_id: z.string().uuid().nullable(),
  what_worked: z.array(z.string().min(1).max(50)).max(6),
  what_could_improve: z.array(z.string().min(1).max(50)).max(6),
  needs_rework: z.boolean(),
  free_text_comment: z.string().max(2000).nullable(),
});

export const FeedbackSubmitResponseSchema = z.object({
  ok: z.literal(true),
  status: z.enum(['submitted', 'already_submitted']),
  delta_status: z.enum(['succeeded', 'failed', 'skipped']),
});

export const FeedbackLoadOkSchema = z.object({
  status: z.literal('ok'),
  delivery: z.object({
    subject: z.string(),
    recipient_name: z.string().nullable(),
    sent_at: z.string().nullable(),
    audit_report_version: z.string(),
  }),
  project: z.object({ name: z.string() }),
  content_item: z.object({ content_sub_type: ContentSubTypeSchema }),
  variants: z.array(SnapshotVariantSchema),
  recommended_variant_id: z.string().uuid().nullable(),
  sender: z.object({ from_name: z.string() }),
  expires_at: z.string(),
});

export const FeedbackLoadAlreadySubmittedSchema = z.object({
  status: z.literal('already_submitted'),
  submitted_at: z.string(),
  sender: z.object({ from_name: z.string() }),
  project: z.object({ name: z.string() }),
});

export const FeedbackLoadInvalidSchema = z.object({
  status: z.literal('invalid'),
});

export const FeedbackLoadResponseSchema = z.discriminatedUnion('status', [
  FeedbackLoadOkSchema,
  FeedbackLoadAlreadySubmittedSchema,
  FeedbackLoadInvalidSchema,
]);
// drift:end FEEDBACK_TYPES

export type FeedbackSubmitInput = z.infer<typeof FeedbackSubmitInputSchema>;
export type FeedbackSubmitResponse = z.infer<typeof FeedbackSubmitResponseSchema>;
export type FeedbackLoadResponse = z.infer<typeof FeedbackLoadResponseSchema>;
export type FeedbackLoadOk = z.infer<typeof FeedbackLoadOkSchema>;
export type FeedbackLoadAlreadySubmitted = z.infer<
  typeof FeedbackLoadAlreadySubmittedSchema
>;

export { SnapshotVariantSchema } from './delivery';
export type { SnapshotVariant } from './delivery';
