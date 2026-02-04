/**
 * ClearPress AI - Client Request Wizard Types
 * Types for the guided content request wizard on the client portal
 */

import type { ContentType, ToneType, UrgencyLevel, ExpandedBrief } from './index';

/**
 * Wizard step identifiers
 */
export type RequestWizardStep =
  | 'template'
  | 'basic'
  | 'brief'
  | 'context'
  | 'review';

/**
 * Uploaded file reference
 */
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

/**
 * Client request template for quick-start
 */
export interface ClientRequestTemplate {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  description_en: string;
  icon: string;
  defaults: Partial<ClientRequestWizardData>;
}

/**
 * Full wizard form data collected across all steps
 */
export interface ClientRequestWizardData {
  // Step 1: Template selection (stored for reference)
  template_id?: string;

  // Step 2: Basic Info
  name: string;
  urgency: UrgencyLevel;
  target_date?: string;
  content_type_hints: ContentType[];

  // Step 3: Detailed Brief
  description: string;
  objectives: string[];
  key_messages: string[];
  target_audience: string;
  tone: ToneType;
  custom_tone?: string;
  special_requirements?: string;

  // Step 4: Context
  product_name?: string;
  therapeutic_area?: string;
  key_dates?: string;
  regulatory_notes?: string;
  reference_files: UploadedFile[];
}

/**
 * Initial/default wizard data
 */
export const initialWizardData: ClientRequestWizardData = {
  template_id: undefined,
  name: '',
  urgency: 'standard',
  target_date: undefined,
  content_type_hints: [],
  description: '',
  objectives: [],
  key_messages: [],
  target_audience: '',
  tone: 'professional',
  custom_tone: undefined,
  special_requirements: undefined,
  product_name: undefined,
  therapeutic_area: undefined,
  key_dates: undefined,
  regulatory_notes: undefined,
  reference_files: [],
};

/**
 * Payload sent to create the project request
 */
export interface ClientProjectRequestPayload {
  name: string;
  brief: string;
  expanded_brief: ExpandedBrief;
  urgency: UrgencyLevel;
  target_date?: string;
  metadata: {
    content_type_hints: ContentType[];
    template_used?: string;
    reference_file_ids: string[];
  };
}

/**
 * Validation result for a wizard step
 */
export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Transform wizard data to project creation payload
 */
export function transformToPayload(
  data: ClientRequestWizardData
): ClientProjectRequestPayload {
  // Build text brief for backward compatibility
  const briefParts: string[] = [data.description];

  if (data.objectives.length > 0) {
    briefParts.push(`\n\n【目標】\n${data.objectives.map((o) => `• ${o}`).join('\n')}`);
  }

  if (data.key_messages.length > 0) {
    briefParts.push(
      `\n\n【キーメッセージ】\n${data.key_messages.map((m) => `• ${m}`).join('\n')}`
    );
  }

  if (data.special_requirements) {
    briefParts.push(`\n\n【特別要件】\n${data.special_requirements}`);
  }

  if (data.product_name) {
    briefParts.push(`\n\n【製品名】\n${data.product_name}`);
  }

  if (data.key_dates) {
    briefParts.push(`\n\n【重要日程】\n${data.key_dates}`);
  }

  if (data.regulatory_notes) {
    briefParts.push(`\n\n【規制関連】\n${data.regulatory_notes}`);
  }

  // Build expanded brief for rich structured data
  const expandedBrief: ExpandedBrief = {
    summary: data.description,
    target_audience: {
      primary: data.target_audience ? [data.target_audience] : [],
      secondary: [],
    },
    key_messages: data.key_messages,
    tone: data.custom_tone || data.tone,
    deliverables: data.content_type_hints.map((type) => ({
      type,
      notes: undefined,
    })),
    constraints: data.special_requirements ? [data.special_requirements] : [],
    references: data.reference_files.map((f) => f.url),
  };

  return {
    name: data.name,
    brief: briefParts.join(''),
    expanded_brief: expandedBrief,
    urgency: data.urgency,
    target_date: data.target_date,
    metadata: {
      content_type_hints: data.content_type_hints,
      template_used: data.template_id,
      reference_file_ids: data.reference_files.map((f) => f.id),
    },
  };
}

/**
 * Validate a specific wizard step
 */
export function validateStep(
  step: RequestWizardStep,
  data: ClientRequestWizardData,
  language: 'ja' | 'en'
): StepValidation {
  const errors: Record<string, string> = {};

  switch (step) {
    case 'template':
      // Template selection is optional
      break;

    case 'basic':
      if (!data.name.trim()) {
        errors.name =
          language === 'ja'
            ? 'リクエスト名は必須です'
            : 'Request name is required';
      } else if (data.name.length > 200) {
        errors.name =
          language === 'ja'
            ? 'リクエスト名は200文字以内で入力してください'
            : 'Request name must be 200 characters or less';
      }
      break;

    case 'brief':
      if (!data.description.trim()) {
        errors.description =
          language === 'ja'
            ? '依頼内容は必須です'
            : 'Description is required';
      } else if (data.description.length < 20) {
        errors.description =
          language === 'ja'
            ? '依頼内容は20文字以上で入力してください'
            : 'Description must be at least 20 characters';
      }
      break;

    case 'context':
      // All context fields are optional
      break;

    case 'review':
      // Validate all required fields for final submission
      if (!data.name.trim()) {
        errors.name =
          language === 'ja' ? 'リクエスト名が未入力です' : 'Request name is missing';
      }
      if (!data.description.trim() || data.description.length < 20) {
        errors.description =
          language === 'ja' ? '依頼内容が不十分です' : 'Description is insufficient';
      }
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
