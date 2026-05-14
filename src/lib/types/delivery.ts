/**
 * TS mirror of supabase/functions/_shared/types-delivery.ts. The Deno copy
 * is authoritative for send-delivery / process-scheduled-sends / feedback-load
 * parsing. This mirror is for: composer form validation (RHF + zod), client
 * hooks that need the DeliverySnapshot shape, and the vitest drift guard in
 * src/__tests__/delivery-snapshot.drift.test.ts.
 */
import { z } from 'zod';

// drift:start DELIVERY_TYPES
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const emailString = z.string().refine((v) => EMAIL_RE.test(v), {
  message: 'invalid_email',
});

export const SchedulingWarningSchema = z.enum([
  'outside_business_hours',
  'japanese_holiday',
]);

export const AttachmentFormatSchema = z.enum(['pdf', 'word', 'both']);

export const ContentSubTypeSchema = z.enum([
  'auto',
  'full_clinical',
  'partner_ack',
  'csr_event',
  'business_news',
]);

export const SnapshotVariantSchema = z.object({
  id: z.string().uuid(),
  variant_label: z.string(),
  variant_index: z.number().int().min(1).max(3),
  body_html: z.string().nullable(),
  body_text: z.string(),
  variation_directive: z.string().nullable(),
  char_count: z.number().int(),
});

export const DeliverySnapshotSchema = z.object({
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  content_item: z.object({
    id: z.string().uuid(),
    content_sub_type: ContentSubTypeSchema,
  }),
  variants: z.array(SnapshotVariantSchema).min(1).max(3),
  recommended_variant_id: z.string().uuid().nullable(),
  audit_report: z.object({
    id: z.string().uuid(),
    version_major: z.number().int(),
    version_minor: z.number().int(),
    finalized_at: z.string(),
    signature_hash: z.string().nullable(),
  }),
  sender: z.object({
    from_name: z.string(),
    from_email: emailString,
    reply_to_email: emailString,
    sent_by_email_snapshot: emailString,
  }),
  recipient: z.object({
    email: emailString,
    name: z.string().nullable(),
    cc_emails: z.array(emailString),
    bcc_emails_effective: z.array(emailString),
  }),
  scheduling_warnings: z.array(SchedulingWarningSchema),
});

export const ComposerInputSchema = z.object({
  project_id: z.string().uuid(),
  content_item_id: z.string().uuid(),
  variant_ids: z.array(z.string().uuid()).min(1).max(3),
  recommended_variant_id: z.string().uuid().nullable().optional(),
  recipient_email: emailString,
  recipient_name: z.string().nullable().optional(),
  cc_emails: z.array(emailString).optional(),
  bcc_emails: z.array(emailString).optional(),
  subject: z.string().min(1).max(200),
  body_html: z.string().min(1),
  body_text: z.string().optional(),
  attachment_format: AttachmentFormatSchema,
  scheduling_warnings: z.array(SchedulingWarningSchema).optional(),
  scheduled_for: z.string().datetime().nullable().optional(),
});

export const FeedbackLoadResponseSchema = z.object({
  delivery: z.object({
    subject: z.string(),
    recipient_name: z.string().nullable(),
    sent_at: z.string().nullable(),
    audit_report_version: z.string(),
  }),
  project: z.object({
    name: z.string(),
  }),
  content_item: z.object({
    content_sub_type: ContentSubTypeSchema,
  }),
  variants: z.array(SnapshotVariantSchema),
  recommended_variant_id: z.string().uuid().nullable(),
  expires_at: z.string(),
});
// drift:end DELIVERY_TYPES

export type DeliverySnapshot = z.infer<typeof DeliverySnapshotSchema>;
export type SnapshotVariant = z.infer<typeof SnapshotVariantSchema>;
export type ComposerInput = z.infer<typeof ComposerInputSchema>;
export type FeedbackLoadResponse = z.infer<typeof FeedbackLoadResponseSchema>;
export type SchedulingWarning = z.infer<typeof SchedulingWarningSchema>;
export type AttachmentFormat = z.infer<typeof AttachmentFormatSchema>;
export type ContentSubType = z.infer<typeof ContentSubTypeSchema>;
