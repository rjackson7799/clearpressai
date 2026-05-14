import type { Database } from './database';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

export type Client = Tables['clients']['Row'];
export type ClientInsert = Tables['clients']['Insert'];
export type ClientUpdate = Tables['clients']['Update'];

export type BrandVoiceSample = Tables['brand_voice_samples']['Row'];
export type BrandVoiceSampleInsert = Tables['brand_voice_samples']['Insert'];

export type BrandVoiceProfileRow = Tables['brand_voice_profiles']['Row'];
export type BrandVoiceProfileUpdate = Tables['brand_voice_profiles']['Update'];

export type BrandVoiceGuideline = Tables['brand_voice_guidelines']['Row'];
export type BrandVoiceGuidelineInsert = Tables['brand_voice_guidelines']['Insert'];

export type GuidelineSourceType =
  | 'extraction'
  | 'internal_annotation'
  | 'client_feedback'
  | 'legal_review';

export type Project = Tables['projects']['Row'];
export type ProjectInsert = Tables['projects']['Insert'];
export type ProjectUpdate = Tables['projects']['Update'];
export type ProjectSummary = Views['project_summary']['Row'];

export type ContentItem = Tables['content_items']['Row'];
export type ContentItemInsert = Tables['content_items']['Insert'];

export type ContentVariant = Tables['content_variants']['Row'];
export type ContentVariantUpdate = Tables['content_variants']['Update'];

export type ComplianceFindingRow = Tables['compliance_findings']['Row'];
export type ComplianceFindingUpdate = Tables['compliance_findings']['Update'];

export type AuditReport = Tables['audit_reports']['Row'];
export type AuditSignature = Tables['audit_signatures']['Row'];
export type AuditTrailEvent = Tables['audit_trail_events']['Row'];
export type AuditReportStatus = 'draft' | 'finalized' | 'revised';

export type Delivery = Tables['deliveries']['Row'];
export type DeliveryStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type AttachmentFormat = 'pdf' | 'word' | 'both';
export type ScheduledSend = Tables['scheduled_sends']['Row'];
export type FeedbackToken = Tables['feedback_tokens']['Row'];

export type ContentType =
  | 'press_release'
  | 'blog_post'
  | 'social_media'
  | 'internal_memo'
  | 'faq'
  | 'executive_statement';

export type ContentSubType =
  | 'auto'
  | 'full_clinical'
  | 'partner_ack'
  | 'csr_event'
  | 'business_news';

export type VariationAxis = 'tone' | 'structure' | 'length';

export type ProjectStatus =
  | 'draft'
  | 'in_review'
  | 'delivered'
  | 'feedback_received'
  | 'completed';

export type ProjectUrgency = 'standard' | 'priority' | 'urgent' | 'crisis';

export type ComplianceSeverity = 'blocker' | 'warning' | 'note';

export type ComplianceResolutionStatus =
  | 'unresolved'
  | 'fixed'
  | 'acknowledged';

export interface BriefQuote {
  name: string;
  title: string;
  quote: string;
}
