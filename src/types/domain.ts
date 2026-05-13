import type { Database } from './database';

type Tables = Database['public']['Tables'];

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
