/**
 * ClearPress AI - Suggestions Service
 * Operations for client suggestions (track changes)
 */

import { supabase } from './supabase';
import type { ClientSuggestion, User } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbClientSuggestion = Database['public']['Tables']['client_suggestions']['Row'];

// Suggestion status type
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

// ===== Type Converters =====

function dbSuggestionToSuggestion(
  row: DbClientSuggestion & {
    user?: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
    reviewer?: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
  }
): ClientSuggestion {
  return {
    id: row.id,
    content_item_id: row.content_item_id,
    version_id: row.version_id,
    user_id: row.user_id,
    before_text: row.before_text,
    after_text: row.after_text,
    position: row.position as { start_offset: number; end_offset: number },
    reason: row.reason ?? undefined,
    status: (row.status ?? 'pending') as SuggestionStatus,
    reviewed_by: row.reviewed_by ?? undefined,
    reviewed_at: row.reviewed_at ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    user: row.user as User | undefined,
  };
}

// ===== Create Suggestion Data =====

export interface CreateSuggestionData {
  content_item_id: string;
  version_id: string;
  before_text: string;
  after_text: string;
  position: { start_offset: number; end_offset: number };
  reason?: string;
}

// ===== Suggestion CRUD =====

/**
 * Fetch all suggestions for a content item
 */
export async function fetchSuggestions(
  contentItemId: string
): Promise<ClientSuggestion[]> {
  const { data, error } = await supabase
    .from('client_suggestions')
    .select(`
      *,
      user:users!client_suggestions_user_id_fkey(id, name, avatar_url),
      reviewer:users!client_suggestions_reviewed_by_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .order('position->start_offset', { ascending: true });

  if (error) {
    console.error('Error fetching suggestions:', error);
    throw new Error('提案の取得に失敗しました');
  }

  return (data ?? []).map((row) =>
    dbSuggestionToSuggestion({
      ...(row as unknown as DbClientSuggestion),
      user: row.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
      reviewer: row.reviewer as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
    })
  );
}

/**
 * Fetch pending suggestions for a content item
 */
export async function fetchPendingSuggestions(
  contentItemId: string
): Promise<ClientSuggestion[]> {
  const { data, error } = await supabase
    .from('client_suggestions')
    .select(`
      *,
      user:users!client_suggestions_user_id_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .eq('status', 'pending')
    .order('position->start_offset', { ascending: true });

  if (error) {
    console.error('Error fetching pending suggestions:', error);
    throw new Error('保留中の提案の取得に失敗しました');
  }

  return (data ?? []).map((row) =>
    dbSuggestionToSuggestion({
      ...(row as unknown as DbClientSuggestion),
      user: row.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
    })
  );
}

/**
 * Fetch pending suggestion count for a content item
 */
export async function fetchPendingSuggestionCount(
  contentItemId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('client_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('content_item_id', contentItemId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending suggestion count:', error);
    throw new Error('提案数の取得に失敗しました');
  }

  return count ?? 0;
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(
  data: CreateSuggestionData,
  userId: string
): Promise<ClientSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('client_suggestions')
    .insert({
      content_item_id: data.content_item_id,
      version_id: data.version_id,
      user_id: userId,
      before_text: data.before_text,
      after_text: data.after_text,
      position: data.position as unknown as Database['public']['Tables']['client_suggestions']['Insert']['position'],
      reason: data.reason,
      status: 'pending',
    })
    .select(`
      *,
      user:users!client_suggestions_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating suggestion:', error);
    throw new Error('提案の作成に失敗しました');
  }

  return dbSuggestionToSuggestion({
    ...(suggestion as unknown as DbClientSuggestion),
    user: suggestion.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Accept a suggestion
 */
export async function acceptSuggestion(
  suggestionId: string,
  reviewerId: string
): Promise<ClientSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('client_suggestions')
    .update({
      status: 'accepted',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)
    .select(`
      *,
      user:users!client_suggestions_user_id_fkey(id, name, avatar_url),
      reviewer:users!client_suggestions_reviewed_by_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error accepting suggestion:', error);
    throw new Error('提案の承認に失敗しました');
  }

  return dbSuggestionToSuggestion({
    ...(suggestion as unknown as DbClientSuggestion),
    user: suggestion.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
    reviewer: suggestion.reviewer as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(
  suggestionId: string,
  reviewerId: string
): Promise<ClientSuggestion> {
  const { data: suggestion, error } = await supabase
    .from('client_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', suggestionId)
    .select(`
      *,
      user:users!client_suggestions_user_id_fkey(id, name, avatar_url),
      reviewer:users!client_suggestions_reviewed_by_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error rejecting suggestion:', error);
    throw new Error('提案の拒否に失敗しました');
  }

  return dbSuggestionToSuggestion({
    ...(suggestion as unknown as DbClientSuggestion),
    user: suggestion.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
    reviewer: suggestion.reviewer as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Delete a suggestion (only if pending and owned by user)
 */
export async function deleteSuggestion(
  suggestionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('client_suggestions')
    .delete()
    .eq('id', suggestionId)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error deleting suggestion:', error);
    throw new Error('提案の削除に失敗しました');
  }
}

/**
 * Get suggestion statistics for a content item
 */
export async function fetchSuggestionStats(contentItemId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}> {
  const { data, error } = await supabase
    .from('client_suggestions')
    .select('status')
    .eq('content_item_id', contentItemId);

  if (error) {
    console.error('Error fetching suggestion stats:', error);
    throw new Error('提案統計の取得に失敗しました');
  }

  const stats = {
    total: data?.length ?? 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  data?.forEach((item) => {
    if (item.status === 'pending') stats.pending++;
    else if (item.status === 'accepted') stats.accepted++;
    else if (item.status === 'rejected') stats.rejected++;
  });

  return stats;
}
