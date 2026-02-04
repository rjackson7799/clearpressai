/**
 * ClearPress AI - Industries Service
 * CRUD operations for industries (mostly read-only)
 */

import { supabase } from './supabase';
import type { Industry, IndustryConfig } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbIndustry = Database['public']['Tables']['industries']['Row'];

// ===== Type Converters =====

function dbIndustryToIndustry(row: DbIndustry): Industry {
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name_en,
    name_ja: row.name_ja,
    is_active: row.is_active ?? true,
    icon: row.icon ?? undefined,
    config: (row.config as unknown as IndustryConfig) ?? {},
    compliance_rules: row.compliance_rules ?? undefined,
    prompts: (row.prompts as unknown as Record<string, string>) ?? undefined,
  };
}

/**
 * Fetch all active industries
 */
export async function fetchIndustries(): Promise<Industry[]> {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('is_active', true)
    .order('name_ja', { ascending: true });

  if (error) {
    console.error('Error fetching industries:', error);
    throw new Error('業界情報の取得に失敗しました');
  }

  return (data ?? []).map(dbIndustryToIndustry);
}

/**
 * Fetch a single industry by ID
 */
export async function fetchIndustry(industryId: string): Promise<Industry | null> {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('id', industryId)
    .single();

  if (error) {
    console.error('Error fetching industry:', error);
    throw new Error('業界情報の取得に失敗しました');
  }

  return data ? dbIndustryToIndustry(data) : null;
}

/**
 * Fetch a single industry by slug
 */
export async function fetchIndustryBySlug(slug: string): Promise<Industry | null> {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching industry by slug:', error);
    throw new Error('業界情報の取得に失敗しました');
  }

  return data ? dbIndustryToIndustry(data) : null;
}

/**
 * Get industry name based on language
 */
export function getIndustryName(industry: Industry, language: 'ja' | 'en'): string {
  return language === 'ja' ? industry.name_ja : industry.name_en;
}

/**
 * Get industry icon (returns a Lucide icon name)
 */
export function getIndustryIcon(industry: Industry): string {
  // Map industry slugs to Lucide icon names
  const iconMap: Record<string, string> = {
    pharmaceutical: 'Pill',
    healthcare: 'Heart',
    technology: 'Cpu',
    finance: 'Landmark',
    consumer_goods: 'ShoppingCart',
    manufacturing: 'Factory',
    energy: 'Zap',
    education: 'GraduationCap',
    default: 'Building2',
  };

  return iconMap[industry.slug] ?? industry.icon ?? iconMap.default;
}
