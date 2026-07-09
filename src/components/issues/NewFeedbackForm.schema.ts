import { z } from 'zod';
import { INTERNAL_FEEDBACK_TYPES } from '@/lib/internal-feedback';

// Attachments are handled outside RHF (File state in the dialog), so the form
// schema only covers the text fields.
export const newFeedbackSchema = z.object({
  type: z.enum(INTERNAL_FEEDBACK_TYPES),
  message: z.string().trim().min(1, 'internalFeedback.errors.messageRequired'),
});

export type NewFeedbackValues = z.infer<typeof newFeedbackSchema>;
