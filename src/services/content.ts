/**
 * ClearPress AI - Content Service
 * CRUD operations for content items
 */

import { supabase } from './supabase';
import type {
  ContentItem,
  ContentStatus,
  ContentType,
  ContentFilters,
  ContentSettings,
  PaginatedResponse,
} from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbContentItem = Database['public']['Tables']['content_items']['Row'];

// ===== Type Converters =====

function dbContentItemToContentItem(row: DbContentItem): ContentItem {
  return {
    ...row,
    status: (row.status ?? 'draft') as ContentStatus,
    type: row.type as ContentType,
    current_version_id: row.current_version_id ?? undefined,
    settings: (row.settings as unknown as ContentSettings) ?? {},
    locked_by: row.locked_by ?? undefined,
    locked_at: row.locked_at ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// ===== Content Item CRUD =====

/**
 * Fetch all content items for a project
 */
export async function fetchContentItems(
  projectId: string,
  filters?: ContentFilters & { page?: number; per_page?: number }
): Promise<PaginatedResponse<ContentItem>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('content_items')
    .select(`
      *,
      current_version:content_versions!content_items_current_version_fkey(
        id,
        version_number,
        compliance_score,
        word_count,
        created_at
      ),
      created_by_user:users!content_items_created_by_fkey(id, name, avatar_url),
      locked_by_user:users!content_items_locked_by_fkey(id, name, avatar_url)
    `, { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching content items:', error);
    throw new Error('コンテンツの取得に失敗しました');
  }

  return {
    data: (data ?? []).map((row) => dbContentItemToContentItem(row as unknown as DbContentItem)),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Fetch a single content item by ID
 */
export async function fetchContentItem(contentItemId: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      project:projects(
        id,
        name,
        client_id,
        client:clients(id, name, style_profile)
      ),
      current_version:content_versions!content_items_current_version_fkey(*),
      created_by_user:users!content_items_created_by_fkey(id, name, email, avatar_url),
      locked_by_user:users!content_items_locked_by_fkey(id, name, avatar_url)
    `)
    .eq('id', contentItemId)
    .single();

  if (error) {
    console.error('Error fetching content item:', error);
    throw new Error('コンテンツの取得に失敗しました');
  }

  return data ? dbContentItemToContentItem(data as unknown as DbContentItem) : null;
}

/**
 * Create a new content item
 */
export async function createContentItem(
  projectId: string,
  data: {
    type: ContentType;
    title: string;
    settings?: ContentSettings;
  },
  userId: string
): Promise<ContentItem> {
  const { data: contentItem, error } = await supabase
    .from('content_items')
    .insert({
      project_id: projectId,
      type: data.type,
      title: data.title,
      status: 'draft',
      settings: (data.settings ?? {}) as unknown as Database['public']['Tables']['content_items']['Insert']['settings'],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content item:', error);
    throw new Error('コンテンツの作成に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

/**
 * Update an existing content item
 */
export async function updateContentItem(
  contentItemId: string,
  data: {
    title?: string;
    settings?: ContentSettings;
    current_version_id?: string;
  }
): Promise<ContentItem> {
  const updateData: Database['public']['Tables']['content_items']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.settings !== undefined) updateData.settings = data.settings as unknown as Database['public']['Tables']['content_items']['Update']['settings'];
  if (data.current_version_id !== undefined) updateData.current_version_id = data.current_version_id;

  const { data: contentItem, error } = await supabase
    .from('content_items')
    .update(updateData)
    .eq('id', contentItemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating content item:', error);
    throw new Error('コンテンツの更新に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

/**
 * Update content item status
 */
export async function updateContentStatus(
  contentItemId: string,
  status: ContentStatus
): Promise<ContentItem> {
  const { data: contentItem, error } = await supabase
    .from('content_items')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentItemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating content status:', error);
    throw new Error('ステータスの更新に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

/**
 * Delete a content item
 */
export async function deleteContentItem(contentItemId: string): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', contentItemId);

  if (error) {
    console.error('Error deleting content item:', error);
    throw new Error('コンテンツの削除に失敗しました');
  }
}

// ===== Content Locking =====

/**
 * Lock a content item for editing
 */
export async function lockContentItem(
  contentItemId: string,
  userId: string
): Promise<ContentItem> {
  // First check if already locked by another user
  const { data: existing } = await supabase
    .from('content_items')
    .select('locked_by, locked_at')
    .eq('id', contentItemId)
    .single();

  if (existing?.locked_by && existing.locked_by !== userId) {
    // Check if lock is stale (older than 30 minutes)
    const lockTime = new Date(existing.locked_at!).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (now - lockTime < thirtyMinutes) {
      throw new Error('このコンテンツは他のユーザーが編集中です');
    }
  }

  const { data: contentItem, error } = await supabase
    .from('content_items')
    .update({
      locked_by: userId,
      locked_at: new Date().toISOString(),
    })
    .eq('id', contentItemId)
    .select()
    .single();

  if (error) {
    console.error('Error locking content item:', error);
    throw new Error('ロックの取得に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

/**
 * Unlock a content item
 */
export async function unlockContentItem(
  contentItemId: string,
  userId: string
): Promise<ContentItem> {
  // Only unlock if current user holds the lock
  const { data: contentItem, error } = await supabase
    .from('content_items')
    .update({
      locked_by: null,
      locked_at: null,
    })
    .eq('id', contentItemId)
    .eq('locked_by', userId)
    .select()
    .single();

  if (error) {
    console.error('Error unlocking content item:', error);
    throw new Error('ロックの解除に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

/**
 * Force unlock a content item (admin only)
 */
export async function forceUnlockContentItem(
  contentItemId: string
): Promise<ContentItem> {
  const { data: contentItem, error } = await supabase
    .from('content_items')
    .update({
      locked_by: null,
      locked_at: null,
    })
    .eq('id', contentItemId)
    .select()
    .single();

  if (error) {
    console.error('Error force unlocking content item:', error);
    throw new Error('ロックの強制解除に失敗しました');
  }

  return dbContentItemToContentItem(contentItem);
}

// ===== Content Statistics =====

/**
 * Fetch content statistics for a project
 */
export async function fetchContentStats(projectId: string): Promise<{
  total: number;
  by_status: Record<ContentStatus, number>;
  by_type: Record<ContentType, number>;
}> {
  const { data, error } = await supabase
    .from('content_items')
    .select('status, type')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching content stats:', error);
    throw new Error('統計情報の取得に失敗しました');
  }

  const stats = {
    total: data?.length ?? 0,
    by_status: {
      draft: 0,
      submitted: 0,
      in_review: 0,
      needs_revision: 0,
      approved: 0,
    } as Record<ContentStatus, number>,
    by_type: {
      press_release: 0,
      blog_post: 0,
      social_media: 0,
      internal_memo: 0,
      faq: 0,
      executive_statement: 0,
    } as Record<ContentType, number>,
  };

  data?.forEach((item) => {
    if (item.status) {
      stats.by_status[item.status as ContentStatus]++;
    }
    if (item.type) {
      stats.by_type[item.type as ContentType]++;
    }
  });

  return stats;
}

// ===== All Content Items (Cross-Project) =====

/**
 * Extended filters for all content query
 */
export interface AllContentFilters extends ContentFilters {
  client_id?: string;
  project_id?: string;
  page?: number;
  per_page?: number;
}

/**
 * Content item with project info
 */
export interface ContentItemWithProject extends ContentItem {
  project?: {
    id: string;
    name: string;
    client?: { id: string; name: string };
  };
}

/**
 * Fetch all content items across all projects for an organization
 */
export async function fetchAllContentItems(
  organizationId: string,
  filters?: AllContentFilters
): Promise<PaginatedResponse<ContentItemWithProject>> {
  const page = filters?.page ?? 1;
  const perPage = filters?.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('content_items')
    .select(`
      *,
      project:projects!inner(id, name, organization_id, client_id, client:clients(id, name)),
      current_version:content_versions!content_items_current_version_fkey(
        id,
        version_number,
        compliance_score,
        word_count,
        created_at
      ),
      created_by_user:users!content_items_created_by_fkey(id, name, avatar_url),
      locked_by_user:users!content_items_locked_by_fkey(id, name, avatar_url)
    `, { count: 'exact' })
    .eq('projects.organization_id', organizationId)
    .order('updated_at', { ascending: false });

  // Filter by client (filter on the joined projects table)
  if (filters?.client_id) {
    query = query.eq('projects.client_id', filters.client_id);
  }

  // Filter by project
  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  // Apply content type filter
  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }

  // Apply status filter
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // Apply search filter
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching all content items:', error);
    throw new Error('コンテンツの取得に失敗しました');
  }

  return {
    data: (data ?? []).map((row) => ({
      ...dbContentItemToContentItem(row as unknown as DbContentItem),
      project: row.project as { id: string; name: string; client?: { id: string; name: string } },
    })),
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  };
}

/**
 * Fetch pending content items for review (Client Portal)
 */
export async function fetchPendingContentForClient(
  clientId: string
): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      project:projects!inner(id, name, client_id),
      current_version:content_versions!content_items_current_version_fkey(
        id,
        version_number,
        compliance_score,
        created_at
      )
    `)
    .eq('projects.client_id', clientId)
    .eq('status', 'in_review')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending content:', error);
    throw new Error('承認待ちコンテンツの取得に失敗しました');
  }

  return (data ?? []).map((row) => dbContentItemToContentItem(row as unknown as DbContentItem));
}

// ===== Content Duplication =====

/**
 * Duplicate a content item with its current version
 */
export async function duplicateContentItem(
  sourceContentId: string,
  userId: string
): Promise<ContentItem> {
  // 1. Fetch source with current_version
  const source = await fetchContentItem(sourceContentId);
  if (!source) {
    throw new Error('複製元のコンテンツが見つかりません');
  }

  // 2. Create new content item
  const newItem = await createContentItem(
    source.project_id,
    {
      type: source.type,
      title: `${source.title} - コピー`,
      settings: source.settings,
    },
    userId
  );

  // 3. If source has current_version, duplicate it
  if (source.current_version) {
    const { createVersion } = await import('./versions');
    await createVersion(
      newItem.id,
      {
        content: source.current_version.content,
        compliance_score: source.current_version.compliance_score,
        compliance_details: source.current_version.compliance_details,
        generation_params: source.current_version.generation_params,
      },
      userId
    );
  }

  return newItem;
}
