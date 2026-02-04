/**
 * ClearPress AI - AI Service
 * Calls to Supabase Edge Functions for AI-powered features
 */

import { supabase } from './supabase';
import type {
  ContentType,
  StructuredContent,
  ComplianceDetails,
  ExpandedBrief,
  ToneType,
  ContentGenerationBrief,
  GenerateVariantsResponse,
} from '@/types';

// ===== Request/Response Types =====

export interface GenerateContentRequest {
  project_id: string;
  content_type: ContentType;
  brief: string;
  client_style_profile?: {
    tone?: string;
    formality?: 'low' | 'medium' | 'high';
    key_messages?: string[];
    avoid_phrases?: string[];
    boilerplate?: string;
  };
  settings?: {
    tone?: ToneType;
    custom_tone?: string;
    target_length?: number;
    include_isi?: boolean;
    include_boilerplate?: boolean;
    language?: 'ja' | 'en';
  };
}

export interface GenerateContentResponse {
  content: StructuredContent;
  compliance_score: number;
  compliance_details: ComplianceDetails;
  word_count: number;
  generation_params: {
    tone: ToneType;
    model: string;
    temperature: number;
  };
}

export interface CheckComplianceRequest {
  content: string | StructuredContent;
  industry_slug: string;
  content_type?: ContentType;
}

export interface CheckComplianceResponse {
  score: number;
  details: ComplianceDetails;
  suggestions: {
    text: string;
    position?: { start: number; end: number };
    severity: 'error' | 'warning' | 'suggestion';
  }[];
}

export interface ExpandBriefRequest {
  project_id: string;
  brief: string;
  client_id: string;
}

export interface ExpandBriefResponse {
  expanded_brief: ExpandedBrief;
}

export interface AdjustToneRequest {
  content: string;
  current_tone: ToneType;
  target_tone: ToneType;
  custom_tone?: string;
  intensity: number; // 1-5: 1=subtle adjustment, 5=complete rewrite
  language?: 'ja' | 'en';
  preserve_compliance?: boolean;
}

export interface AdjustToneResponse {
  success: boolean;
  adjusted_content?: string;
  word_count?: number;
  changes_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ExtractStyleRequest {
  file_ids: string[];
  client_id: string;
  merge_mode: 'replace' | 'merge';
  language?: 'ja' | 'en';
}

export interface ExtractedStyle {
  tone: string;
  formality: 'low' | 'medium' | 'high';
  vocabulary_patterns: string[];
  structure_preferences: string[];
  key_messages: string[];
  avoid_phrases: string[];
  suggested_boilerplate?: string;
  analysis_notes: string[];
}

export interface ExtractStyleResponse {
  success: boolean;
  extracted_style?: ExtractedStyle;
  files_processed: number;
  error?: {
    code: string;
    message: string;
  };
}

// ===== AI Functions =====

/**
 * Generate content using AI
 */
export async function generateContent(
  request: GenerateContentRequest
): Promise<GenerateContentResponse> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: request,
  });

  if (error) {
    console.error('Error generating content:', error);
    throw new Error('コンテンツの生成に失敗しました');
  }

  return data as GenerateContentResponse;
}

/**
 * Check content compliance
 */
export async function checkCompliance(
  request: CheckComplianceRequest
): Promise<CheckComplianceResponse> {
  const { data, error } = await supabase.functions.invoke('check-compliance', {
    body: request,
  });

  if (error) {
    console.error('Error checking compliance:', error);
    throw new Error('コンプライアンスチェックに失敗しました');
  }

  return data as CheckComplianceResponse;
}

/**
 * Expand a project brief using AI
 */
export async function expandBrief(
  request: ExpandBriefRequest
): Promise<ExpandBriefResponse> {
  const { data, error } = await supabase.functions.invoke('expand-brief', {
    body: request,
  });

  if (error) {
    console.error('Error expanding brief:', error);
    throw new Error('ブリーフの展開に失敗しました');
  }

  return data as ExpandBriefResponse;
}

/**
 * Adjust content tone using AI
 */
export async function adjustTone(
  request: AdjustToneRequest
): Promise<AdjustToneResponse> {
  const { data, error } = await supabase.functions.invoke('adjust-tone', {
    body: request,
  });

  if (error) {
    console.error('Error adjusting tone:', error);
    throw new Error('トーンの調整に失敗しました');
  }

  const response = data as AdjustToneResponse;

  if (!response.success) {
    throw new Error(response.error?.message || 'トーンの調整に失敗しました');
  }

  return response;
}

/**
 * Extract style profile from uploaded reference documents
 */
export async function extractStyle(
  request: ExtractStyleRequest
): Promise<ExtractStyleResponse> {
  const { data, error } = await supabase.functions.invoke('extract-style', {
    body: request,
  });

  if (error) {
    console.error('Error extracting style:', error);
    throw new Error('スタイル抽出に失敗しました');
  }

  return data as ExtractStyleResponse;
}

/**
 * Generate multiple content variants using AI
 * Calls the Edge Function which generates 3 variants in parallel
 */
export async function generateContentVariants(
  brief: ContentGenerationBrief
): Promise<GenerateVariantsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-content-variants', {
    body: brief,
  });

  if (error) {
    console.error('Error generating content variants:', error);
    throw new Error('コンテンツバリエーションの生成に失敗しました');
  }

  return data as GenerateVariantsResponse;
}

/**
 * Enhance a title using AI
 * Returns 3 enhanced title suggestions
 */
export async function enhanceTitle(
  title: string,
  contentType: ContentType,
  context?: string
): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('enhance-title', {
    body: {
      title,
      content_type: contentType,
      context,
    },
  });

  if (error) {
    console.error('Error enhancing title:', error);
    // Return original title as fallback
    return [title];
  }

  // Handle the response
  if (data?.success && data?.suggestions?.length) {
    return data.suggestions;
  }

  // Return original title as fallback
  return [title];
}

// ===== Helper Functions =====

/**
 * Convert structured content to plain text for compliance checking
 */
export function structuredContentToText(content: StructuredContent): string {
  const parts: string[] = [];

  if (content.headline) parts.push(content.headline);
  if (content.subheadline) parts.push(content.subheadline);
  if (content.dateline) parts.push(content.dateline);
  if (content.lead) parts.push(content.lead);
  if (content.body) parts.push(...content.body);
  if (content.quotes) {
    content.quotes.forEach((q) => {
      parts.push(`「${q.text}」— ${q.attribution}`);
    });
  }
  if (content.boilerplate) parts.push(content.boilerplate);
  if (content.isi) parts.push(content.isi);
  if (content.contact) parts.push(content.contact);
  if (content.title) parts.push(content.title);
  if (content.introduction) parts.push(content.introduction);
  if (content.sections) {
    content.sections.forEach((s) => {
      parts.push(s.heading);
      parts.push(s.content);
    });
  }
  if (content.conclusion) parts.push(content.conclusion);
  if (content.cta) parts.push(content.cta);
  if (content.plain_text) parts.push(content.plain_text);

  return parts.join('\n\n');
}

/**
 * Get compliance score color class
 */
export function getComplianceScoreColor(score: number): string {
  if (score >= 90) return 'text-[var(--color-compliance-excellent)] bg-[var(--color-compliance-excellent-light)]';
  if (score >= 70) return 'text-[var(--color-compliance-warning)] bg-[var(--color-compliance-warning-light)]';
  return 'text-[var(--color-compliance-critical)] bg-[var(--color-compliance-critical-light)]';
}

/**
 * Get compliance score label
 */
export function getComplianceScoreLabel(score: number, language: 'ja' | 'en'): string {
  if (score >= 90) {
    return language === 'ja' ? '適合' : 'Compliant';
  }
  if (score >= 70) {
    return language === 'ja' ? '要確認' : 'Needs Review';
  }
  return language === 'ja' ? '要修正' : 'Non-Compliant';
}
