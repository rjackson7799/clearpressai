import { z } from 'zod';

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
  variation_axis: z.enum(['tone', 'structure', 'length']),
  language: z.enum(['ja', 'en']),
  brief_free_text: z.string().min(50, 'brief.errors.briefTooShort'),
  brief_key_messages: z.array(z.string()),
  brief_quotes: z.array(briefQuoteSchema),
  brief_data_points: z.array(z.string()),
  brief_constraints: z.string().optional(),
});

export type NewProjectFormValues = z.infer<typeof newProjectFormSchema>;
export type BriefQuoteFormValue = z.infer<typeof briefQuoteSchema>;
