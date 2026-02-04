/**
 * ClearPress AI - Content Templates
 * Pre-built templates for the guided content creation wizard
 */

import type { ContentTemplate } from '@/types';

/**
 * Default target lengths by content type (in words)
 */
export const DEFAULT_TARGET_LENGTHS: Record<string, number> = {
  press_release: 800,
  blog_post: 1200,
  social_media: 280,
  internal_memo: 400,
  faq: 600,
  executive_statement: 500,
};

/**
 * Content templates for guided content creation
 */
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'product-launch',
    slug: 'product_launch',
    name_ja: '製品発売',
    name_en: 'Product Launch',
    description_ja: '新製品や新薬の発売に関するプレスリリース',
    description_en: 'Press release for new product or drug launch',
    icon: 'Rocket',
    defaults: {
      content_type: 'press_release',
      tone: 'professional',
      target_audience: 'healthcare_professionals',
      include_isi: true,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for product benefits
        '', // Placeholder for clinical efficacy
        '', // Placeholder for availability
      ],
      target_length: 800,
    },
  },
  {
    id: 'clinical-trial',
    slug: 'clinical_trial',
    name_ja: '臨床試験結果',
    name_en: 'Clinical Trial Results',
    description_ja: '臨床試験の結果発表に関するプレスリリース',
    description_en: 'Press release announcing clinical trial results',
    icon: 'FlaskConical',
    defaults: {
      content_type: 'press_release',
      tone: 'formal',
      target_audience: 'healthcare_professionals',
      include_isi: true,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for primary endpoint results
        '', // Placeholder for safety profile
        '', // Placeholder for next steps
      ],
      target_length: 1000,
    },
  },
  {
    id: 'executive-appointment',
    slug: 'executive_appointment',
    name_ja: '役員人事',
    name_en: 'Executive Appointment',
    description_ja: '経営陣の人事発表に関するプレスリリース',
    description_en: 'Press release for executive appointments',
    icon: 'UserPlus',
    defaults: {
      content_type: 'press_release',
      tone: 'professional',
      target_audience: 'media',
      include_isi: false,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for appointment details
        '', // Placeholder for experience/background
        '', // Placeholder for company vision
      ],
      target_length: 600,
    },
  },
  {
    id: 'crisis-response',
    slug: 'crisis_response',
    name_ja: '危機対応',
    name_en: 'Crisis Response',
    description_ja: '緊急事態や問題発生時の声明',
    description_en: 'Statement for crisis or emergency situations',
    icon: 'AlertTriangle',
    defaults: {
      content_type: 'executive_statement',
      tone: 'urgent',
      target_audience: 'general_public',
      include_isi: false,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for acknowledgment
        '', // Placeholder for immediate actions
        '', // Placeholder for commitment
      ],
      target_length: 500,
    },
  },
  {
    id: 'regulatory-update',
    slug: 'regulatory_update',
    name_ja: '規制関連',
    name_en: 'Regulatory Update',
    description_ja: '承認取得や規制関連の発表',
    description_en: 'Announcements related to regulatory approvals',
    icon: 'Shield',
    defaults: {
      content_type: 'press_release',
      tone: 'formal',
      target_audience: 'healthcare_professionals',
      include_isi: true,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for approval details
        '', // Placeholder for indication
        '', // Placeholder for availability timeline
      ],
      target_length: 800,
    },
  },
  {
    id: 'partnership',
    slug: 'partnership',
    name_ja: '提携発表',
    name_en: 'Partnership Announcement',
    description_ja: '業務提携や共同開発の発表',
    description_en: 'Announcement of business partnerships or collaborations',
    icon: 'Handshake',
    defaults: {
      content_type: 'press_release',
      tone: 'professional',
      target_audience: 'media',
      include_isi: false,
      include_boilerplate: true,
      key_messages: [
        '', // Placeholder for partnership details
        '', // Placeholder for mutual benefits
        '', // Placeholder for timeline/milestones
      ],
      target_length: 700,
    },
  },
];

/**
 * Get a template by slug
 */
export function getTemplateBySlug(slug: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.slug === slug);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Target audience options with labels
 */
export const TARGET_AUDIENCE_OPTIONS = [
  { value: 'healthcare_professionals', label_ja: '医療従事者', label_en: 'Healthcare Professionals' },
  { value: 'patients', label_ja: '患者', label_en: 'Patients' },
  { value: 'media', label_ja: 'メディア', label_en: 'Media' },
  { value: 'investors', label_ja: '投資家', label_en: 'Investors' },
  { value: 'general_public', label_ja: '一般市民', label_en: 'General Public' },
  { value: 'regulators', label_ja: '規制当局', label_en: 'Regulators' },
] as const;

/**
 * Therapeutic area options with labels
 */
export const THERAPEUTIC_AREA_OPTIONS = [
  { value: 'oncology', label_ja: '腫瘍学', label_en: 'Oncology' },
  { value: 'cardiology', label_ja: '心臓病学', label_en: 'Cardiology' },
  { value: 'neurology', label_ja: '神経学', label_en: 'Neurology' },
  { value: 'immunology', label_ja: '免疫学', label_en: 'Immunology' },
  { value: 'infectious_disease', label_ja: '感染症', label_en: 'Infectious Disease' },
  { value: 'rare_disease', label_ja: '希少疾患', label_en: 'Rare Disease' },
  { value: 'respiratory', label_ja: '呼吸器', label_en: 'Respiratory' },
  { value: 'gastroenterology', label_ja: '消化器', label_en: 'Gastroenterology' },
  { value: 'dermatology', label_ja: '皮膚科', label_en: 'Dermatology' },
  { value: 'ophthalmology', label_ja: '眼科', label_en: 'Ophthalmology' },
  { value: 'other', label_ja: 'その他', label_en: 'Other' },
] as const;
