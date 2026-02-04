/**
 * ClearPress AI - Client Request Templates
 * Pre-defined templates for quick-starting content requests
 */

import type { ClientRequestTemplate, ClientRequestWizardData } from '@/types/client-request';

/**
 * 6 client-focused request templates
 */
export const CLIENT_REQUEST_TEMPLATES: ClientRequestTemplate[] = [
  {
    id: 'product-announcement',
    slug: 'product_announcement',
    name_ja: '製品発表',
    name_en: 'Product Announcement',
    description_ja: '新製品や新薬の発売に関するPR依頼',
    description_en: 'PR request for new product or drug launch',
    icon: 'Package',
    defaults: {
      content_type_hints: ['press_release'],
      target_audience: 'healthcare_professionals',
      tone: 'professional',
      urgency: 'priority',
    },
  },
  {
    id: 'clinical-results',
    slug: 'clinical_results',
    name_ja: '臨床試験結果',
    name_en: 'Clinical Trial Results',
    description_ja: '臨床試験結果の発表依頼',
    description_en: 'Request for clinical trial results announcement',
    icon: 'FlaskConical',
    defaults: {
      content_type_hints: ['press_release', 'blog_post'],
      target_audience: 'healthcare_professionals',
      tone: 'formal',
      urgency: 'standard',
    },
  },
  {
    id: 'corporate-news',
    slug: 'corporate_news',
    name_ja: '企業ニュース',
    name_en: 'Corporate News',
    description_ja: '役員人事、提携など企業関連のニュース',
    description_en: 'Executive appointments, partnerships, corporate updates',
    icon: 'Building2',
    defaults: {
      content_type_hints: ['press_release'],
      target_audience: 'media',
      tone: 'professional',
      urgency: 'standard',
    },
  },
  {
    id: 'crisis-communication',
    slug: 'crisis_communication',
    name_ja: '危機対応',
    name_en: 'Crisis Communication',
    description_ja: '緊急事態や問題対応のコミュニケーション',
    description_en: 'Crisis response and issue management communication',
    icon: 'AlertTriangle',
    defaults: {
      content_type_hints: ['press_release', 'executive_statement'],
      target_audience: 'media',
      tone: 'urgent',
      urgency: 'crisis',
    },
  },
  {
    id: 'event-promotion',
    slug: 'event_promotion',
    name_ja: 'イベント告知',
    name_en: 'Event Promotion',
    description_ja: '学会、イベント、講演会などの告知',
    description_en: 'Conference, symposium, and event announcements',
    icon: 'Calendar',
    defaults: {
      content_type_hints: ['press_release', 'social_media'],
      target_audience: 'healthcare_professionals',
      tone: 'friendly',
      urgency: 'standard',
    },
  },
  {
    id: 'thought-leadership',
    slug: 'thought_leadership',
    name_ja: '業界見解',
    name_en: 'Thought Leadership',
    description_ja: '業界動向、専門家見解の発信',
    description_en: 'Industry insights and expert commentary',
    icon: 'Lightbulb',
    defaults: {
      content_type_hints: ['blog_post', 'executive_statement'],
      target_audience: 'healthcare_professionals',
      tone: 'professional',
      urgency: 'standard',
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ClientRequestTemplate | undefined {
  return CLIENT_REQUEST_TEMPLATES.find((t) => t.id === id);
}

/**
 * Apply template defaults to wizard data
 */
export function applyTemplateDefaults(
  template: ClientRequestTemplate,
  currentData: ClientRequestWizardData
): ClientRequestWizardData {
  return {
    ...currentData,
    template_id: template.id,
    ...template.defaults,
  };
}

/**
 * Target audience options (reused from content-templates.ts)
 */
export const TARGET_AUDIENCE_OPTIONS = [
  {
    value: 'healthcare_professionals',
    label_ja: '医療従事者',
    label_en: 'Healthcare Professionals',
  },
  {
    value: 'patients',
    label_ja: '患者・一般消費者',
    label_en: 'Patients & Consumers',
  },
  {
    value: 'media',
    label_ja: 'メディア・報道関係者',
    label_en: 'Media & Press',
  },
  {
    value: 'investors',
    label_ja: '投資家・株主',
    label_en: 'Investors & Shareholders',
  },
  {
    value: 'general_public',
    label_ja: '一般大衆',
    label_en: 'General Public',
  },
  {
    value: 'regulators',
    label_ja: '規制当局',
    label_en: 'Regulators',
  },
] as const;

/**
 * Therapeutic area options (reused from content-templates.ts)
 */
export const THERAPEUTIC_AREA_OPTIONS = [
  { value: 'oncology', label_ja: 'オンコロジー（がん）', label_en: 'Oncology' },
  { value: 'cardiology', label_ja: '循環器', label_en: 'Cardiology' },
  { value: 'neurology', label_ja: '神経内科', label_en: 'Neurology' },
  { value: 'immunology', label_ja: '免疫', label_en: 'Immunology' },
  { value: 'infectious_disease', label_ja: '感染症', label_en: 'Infectious Disease' },
  { value: 'rare_disease', label_ja: '希少疾患', label_en: 'Rare Disease' },
  { value: 'respiratory', label_ja: '呼吸器', label_en: 'Respiratory' },
  { value: 'gastroenterology', label_ja: '消化器', label_en: 'Gastroenterology' },
  { value: 'dermatology', label_ja: '皮膚科', label_en: 'Dermatology' },
  { value: 'ophthalmology', label_ja: '眼科', label_en: 'Ophthalmology' },
  { value: 'other', label_ja: 'その他', label_en: 'Other' },
] as const;

/**
 * Tone options
 */
export const TONE_OPTIONS = [
  { value: 'formal', label_ja: 'フォーマル', label_en: 'Formal' },
  { value: 'professional', label_ja: 'プロフェッショナル', label_en: 'Professional' },
  { value: 'friendly', label_ja: 'フレンドリー', label_en: 'Friendly' },
  { value: 'urgent', label_ja: '緊急', label_en: 'Urgent' },
  { value: 'custom', label_ja: 'カスタム', label_en: 'Custom' },
] as const;

/**
 * Urgency options with timeline indicators
 */
export const URGENCY_OPTIONS = [
  {
    value: 'standard',
    label_ja: '通常',
    label_en: 'Standard',
    timeline_ja: '5〜7営業日',
    timeline_en: '5-7 business days',
  },
  {
    value: 'priority',
    label_ja: '優先',
    label_en: 'Priority',
    timeline_ja: '2〜3営業日',
    timeline_en: '2-3 business days',
  },
  {
    value: 'urgent',
    label_ja: '緊急',
    label_en: 'Urgent',
    timeline_ja: '24〜48時間',
    timeline_en: '24-48 hours',
  },
  {
    value: 'crisis',
    label_ja: '危機対応',
    label_en: 'Crisis',
    timeline_ja: '当日対応',
    timeline_en: 'Same day',
  },
] as const;

/**
 * Content type options for multi-select
 */
export const CONTENT_TYPE_OPTIONS = [
  { value: 'press_release', label_ja: 'プレスリリース', label_en: 'Press Release' },
  { value: 'blog_post', label_ja: 'ブログ記事', label_en: 'Blog Post' },
  { value: 'social_media', label_ja: 'ソーシャルメディア', label_en: 'Social Media' },
  { value: 'internal_memo', label_ja: '社内文書', label_en: 'Internal Memo' },
  { value: 'faq', label_ja: 'FAQ', label_en: 'FAQ' },
  { value: 'executive_statement', label_ja: '経営者声明', label_en: 'Executive Statement' },
] as const;
