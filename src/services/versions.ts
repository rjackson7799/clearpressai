/**
 * ClearPress AI - Versions Service
 * CRUD operations for content versions
 */

import { supabase } from './supabase';
import type {
  ContentVersion,
  StructuredContent,
  ComplianceDetails,
  GenerationParams,
} from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbContentVersion = Database['public']['Tables']['content_versions']['Row'];

// ===== Type Converters =====

function dbVersionToContentVersion(row: DbContentVersion): ContentVersion {
  return {
    ...row,
    content: (row.content as unknown as StructuredContent) ?? { plain_text: '' },
    compliance_score: row.compliance_score ?? undefined,
    compliance_details: (row.compliance_details as unknown as ComplianceDetails) ?? undefined,
    word_count: row.word_count ?? 0,
    generation_params: (row.generation_params as unknown as GenerationParams) ?? undefined,
    is_milestone: row.is_milestone ?? false,
    milestone_name: row.milestone_name ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

// ===== Version CRUD =====

/**
 * Fetch all versions for a content item
 */
export async function fetchVersions(contentItemId: string): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select(`
      *,
      created_by_user:users!content_versions_created_by_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching versions:', error);
    throw new Error('バージョン履歴の取得に失敗しました');
  }

  return (data ?? []).map((row) => dbVersionToContentVersion(row as unknown as DbContentVersion));
}

/**
 * Fetch a single version by ID
 */
export async function fetchVersion(versionId: string): Promise<ContentVersion | null> {
  const { data, error } = await supabase
    .from('content_versions')
    .select(`
      *,
      created_by_user:users!content_versions_created_by_fkey(id, name, email, avatar_url),
      content_item:content_items(
        id,
        title,
        type,
        project:projects(id, name, client:clients(id, name))
      )
    `)
    .eq('id', versionId)
    .single();

  if (error) {
    console.error('Error fetching version:', error);
    throw new Error('バージョンの取得に失敗しました');
  }

  return data ? dbVersionToContentVersion(data as unknown as DbContentVersion) : null;
}

/**
 * Create a new version for a content item
 */
export async function createVersion(
  contentItemId: string,
  data: {
    content: StructuredContent;
    compliance_score?: number;
    compliance_details?: ComplianceDetails;
    word_count?: number;
    generation_params?: GenerationParams;
  },
  userId: string
): Promise<ContentVersion> {
  // Calculate word count if not provided
  const wordCount = data.word_count ?? calculateWordCount(data.content);

  const { data: version, error } = await supabase
    .from('content_versions')
    .insert({
      content_item_id: contentItemId,
      content: data.content as unknown as Database['public']['Tables']['content_versions']['Insert']['content'],
      compliance_score: data.compliance_score,
      compliance_details: data.compliance_details as unknown as Database['public']['Tables']['content_versions']['Insert']['compliance_details'],
      word_count: wordCount,
      generation_params: data.generation_params as unknown as Database['public']['Tables']['content_versions']['Insert']['generation_params'],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating version:', error);
    throw new Error('バージョンの作成に失敗しました');
  }

  // Update the content item's current_version_id
  await supabase
    .from('content_items')
    .update({
      current_version_id: version.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentItemId);

  return dbVersionToContentVersion(version);
}

/**
 * Mark a version as a milestone
 */
export async function markMilestone(
  versionId: string,
  milestoneName: string
): Promise<ContentVersion> {
  const { data: version, error } = await supabase
    .from('content_versions')
    .update({
      is_milestone: true,
      milestone_name: milestoneName,
    })
    .eq('id', versionId)
    .select()
    .single();

  if (error) {
    console.error('Error marking milestone:', error);
    throw new Error('マイルストーンの設定に失敗しました');
  }

  return dbVersionToContentVersion(version);
}

/**
 * Remove milestone mark from a version
 */
export async function unmarkMilestone(versionId: string): Promise<ContentVersion> {
  const { data: version, error } = await supabase
    .from('content_versions')
    .update({
      is_milestone: false,
      milestone_name: null,
    })
    .eq('id', versionId)
    .select()
    .single();

  if (error) {
    console.error('Error unmarking milestone:', error);
    throw new Error('マイルストーンの解除に失敗しました');
  }

  return dbVersionToContentVersion(version);
}

/**
 * Set a specific version as the current version
 */
export async function setCurrentVersion(
  contentItemId: string,
  versionId: string
): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .update({
      current_version_id: versionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentItemId);

  if (error) {
    console.error('Error setting current version:', error);
    throw new Error('バージョンの設定に失敗しました');
  }
}

/**
 * Restore a previous version (creates a new version with the old content)
 */
export async function restoreVersion(
  versionId: string,
  userId: string
): Promise<ContentVersion> {
  // Fetch the version to restore
  const { data: sourceVersion, error: fetchError } = await supabase
    .from('content_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (fetchError || !sourceVersion) {
    console.error('Error fetching version to restore:', fetchError);
    throw new Error('復元するバージョンの取得に失敗しました');
  }

  // Create a new version with the old content
  const newVersion = await createVersion(
    sourceVersion.content_item_id,
    {
      content: sourceVersion.content as unknown as StructuredContent,
      compliance_score: sourceVersion.compliance_score ?? undefined,
      compliance_details: sourceVersion.compliance_details as unknown as ComplianceDetails | undefined,
      word_count: sourceVersion.word_count ?? undefined,
    },
    userId
  );

  return newVersion;
}

// ===== Version Comparison =====

/**
 * Get two versions for comparison
 */
export async function getVersionsForComparison(
  versionId1: string,
  versionId2: string
): Promise<{ version1: ContentVersion; version2: ContentVersion }> {
  const { data: versions, error } = await supabase
    .from('content_versions')
    .select(`
      *,
      created_by_user:users!content_versions_created_by_fkey(id, name, avatar_url)
    `)
    .in('id', [versionId1, versionId2]);

  if (error || !versions || versions.length !== 2) {
    console.error('Error fetching versions for comparison:', error);
    throw new Error('比較するバージョンの取得に失敗しました');
  }

  const version1 = versions.find((v) => v.id === versionId1);
  const version2 = versions.find((v) => v.id === versionId2);

  if (!version1 || !version2) {
    throw new Error('比較するバージョンが見つかりません');
  }

  return {
    version1: dbVersionToContentVersion(version1 as unknown as DbContentVersion),
    version2: dbVersionToContentVersion(version2 as unknown as DbContentVersion),
  };
}

/**
 * Fetch milestones for a content item
 */
export async function fetchMilestones(contentItemId: string): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select(`
      *,
      created_by_user:users!content_versions_created_by_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .eq('is_milestone', true)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching milestones:', error);
    throw new Error('マイルストーンの取得に失敗しました');
  }

  return (data ?? []).map((row) => dbVersionToContentVersion(row as unknown as DbContentVersion));
}

// ===== Helpers =====

/**
 * Calculate word count from structured content
 */
function calculateWordCount(content: StructuredContent): number {
  let text = '';

  // Collect all text fields
  if (content.headline) text += content.headline + ' ';
  if (content.subheadline) text += content.subheadline + ' ';
  if (content.lead) text += content.lead + ' ';
  if (content.body) text += content.body.join(' ') + ' ';
  if (content.quotes) {
    content.quotes.forEach((q) => {
      text += q.text + ' ';
    });
  }
  if (content.boilerplate) text += content.boilerplate + ' ';
  if (content.isi) text += content.isi + ' ';
  if (content.title) text += content.title + ' ';
  if (content.introduction) text += content.introduction + ' ';
  if (content.sections) {
    content.sections.forEach((s) => {
      text += s.heading + ' ' + s.content + ' ';
    });
  }
  if (content.conclusion) text += content.conclusion + ' ';
  if (content.plain_text) text += content.plain_text + ' ';

  // Count words (works for both Japanese and English)
  // Japanese: count characters, English: count words separated by spaces
  const japaneseChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) ?? [];
  const englishWords = text
    .replace(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Rough approximation: Japanese characters / 2 + English words
  return Math.floor(japaneseChars.length / 2) + englishWords.length;
}
