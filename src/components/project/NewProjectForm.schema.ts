import { z } from 'zod';
import {
  TARGET_AUDIENCE_VALUES,
  DRUG_LIFECYCLE_VALUES,
  DISTRIBUTION_CHANNEL_VALUES,
  LENGTH_TIER_VALUES,
} from '@/lib/project-options';

export const briefQuoteSchema = z.object({
  name: z.string().min(1, 'brief.errors.quoteNameRequired'),
  title: z.string().min(1, 'brief.errors.quoteTitleRequired'),
  quote: z.string().min(1, 'brief.errors.quoteRequired'),
});

export const newProjectFormSchema = z.object({
  client_id: z.string().uuid('brief.errors.clientRequired'),
  name: z.string().min(1, 'brief.errors.nameRequired'),
  content_type: z.enum([
    'press_release',
    'blog_post',
    'social_media',
    'internal_memo',
    'faq',
    'executive_statement',
  ]),
  content_sub_type: z.enum([
    'auto',
    'full_clinical',
    'partner_ack',
    'csr_event',
    'business_news',
  ]),
  urgency: z.enum(['standard', 'priority', 'urgent', 'crisis']),
  deadline: z.string().optional(),
  language: z.enum(['ja', 'en']),
  target_audience: z.enum(TARGET_AUDIENCE_VALUES),
  drug_lifecycle_status: z.enum(DRUG_LIFECYCLE_VALUES),
  distribution_channel: z.enum(DISTRIBUTION_CHANNEL_VALUES),
  length_tier: z.enum(LENGTH_TIER_VALUES),
  // Bounds mirror the DB CHECK (100–10000). null = no explicit target
  // (generate-variants falls back to the sub-type cap).
  length_target_chars: z.number().int().min(100).max(10000).nullable(),
  enforce_hard_cap: z.boolean(),
  variant_count: z.number().int().min(1).max(3),
  brief_free_text: z.string().min(50, 'brief.errors.briefTooShort'),
  brief_key_messages: z.array(z.string()),
  brief_quotes: z.array(briefQuoteSchema),
  brief_data_points: z.array(z.string()),
  brief_constraints: z.string().optional(),
});

export type NewProjectFormValues = z.infer<typeof newProjectFormSchema>;
export type BriefQuoteFormValue = z.infer<typeof briefQuoteSchema>;
