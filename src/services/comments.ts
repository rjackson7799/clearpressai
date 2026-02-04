/**
 * ClearPress AI - Comments Service
 * CRUD operations for comments on content items
 */

import { supabase } from './supabase';
import type { Comment, CommentPosition, User } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbComment = Database['public']['Tables']['comments']['Row'];

// ===== Type Converters =====

function dbCommentToComment(
  row: DbComment & {
    user?: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
    replies?: DbComment[];
  }
): Comment {
  return {
    id: row.id,
    content_item_id: row.content_item_id,
    version_id: row.version_id ?? undefined,
    user_id: row.user_id,
    content: row.content,
    position: row.position as unknown as CommentPosition | undefined,
    parent_id: row.parent_id ?? undefined,
    resolved: row.resolved ?? false,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    user: row.user as User | undefined,
    replies: row.replies?.map((r) => dbCommentToComment(r)) ?? [],
  };
}

// ===== Create Comment Data =====

export interface CreateCommentData {
  content_item_id: string;
  version_id?: string;
  content: string;
  position?: CommentPosition;
  parent_id?: string;
}

// ===== Comment CRUD =====

/**
 * Fetch all comments for a content item
 */
export async function fetchComments(contentItemId: string): Promise<Comment[]> {
  // Fetch top-level comments (parent_id is null)
  const { data: topLevelComments, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw new Error('コメントの取得に失敗しました');
  }

  // Fetch all replies
  const { data: replies, error: repliesError } = await supabase
    .from('comments')
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .not('parent_id', 'is', null)
    .order('created_at', { ascending: true });

  if (repliesError) {
    console.error('Error fetching comment replies:', repliesError);
    throw new Error('返信の取得に失敗しました');
  }

  // Build comment tree
  const replyMap = new Map<string, DbComment[]>();
  (replies ?? []).forEach((reply) => {
    const parentId = reply.parent_id!;
    if (!replyMap.has(parentId)) {
      replyMap.set(parentId, []);
    }
    replyMap.get(parentId)!.push(reply as unknown as DbComment);
  });

  return (topLevelComments ?? []).map((comment) => {
    const commentReplies = replyMap.get(comment.id) ?? [];
    return dbCommentToComment({
      ...(comment as unknown as DbComment),
      user: comment.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
      replies: commentReplies,
    });
  });
}

/**
 * Fetch unresolved comment count for a content item
 */
export async function fetchUnresolvedCommentCount(
  contentItemId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('content_item_id', contentItemId)
    .eq('resolved', false)
    .is('parent_id', null);

  if (error) {
    console.error('Error fetching unresolved comment count:', error);
    throw new Error('コメント数の取得に失敗しました');
  }

  return count ?? 0;
}

/**
 * Create a new comment
 */
export async function createComment(
  data: CreateCommentData,
  userId: string
): Promise<Comment> {
  const insertData: Database['public']['Tables']['comments']['Insert'] = {
    content_item_id: data.content_item_id,
    version_id: data.version_id,
    user_id: userId,
    content: data.content,
    position: data.position as unknown as Database['public']['Tables']['comments']['Insert']['position'],
    parent_id: data.parent_id,
    resolved: false,
  };

  const { data: comment, error } = await supabase
    .from('comments')
    .insert(insertData)
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw new Error('コメントの投稿に失敗しました');
  }

  return dbCommentToComment({
    ...(comment as unknown as DbComment),
    user: comment.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Update an existing comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const { data: comment, error } = await supabase
    .from('comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw new Error('コメントの更新に失敗しました');
  }

  return dbCommentToComment({
    ...(comment as unknown as DbComment),
    user: comment.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Resolve a comment (mark as resolved)
 */
export async function resolveComment(commentId: string): Promise<Comment> {
  const { data: comment, error } = await supabase
    .from('comments')
    .update({
      resolved: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error resolving comment:', error);
    throw new Error('コメントの解決に失敗しました');
  }

  return dbCommentToComment({
    ...(comment as unknown as DbComment),
    user: comment.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Unresolve a comment (mark as unresolved)
 */
export async function unresolveComment(commentId: string): Promise<Comment> {
  const { data: comment, error } = await supabase
    .from('comments')
    .update({
      resolved: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error unresolving comment:', error);
    throw new Error('コメントの再開に失敗しました');
  }

  return dbCommentToComment({
    ...(comment as unknown as DbComment),
    user: comment.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  // Also delete all replies
  const { error: repliesError } = await supabase
    .from('comments')
    .delete()
    .eq('parent_id', commentId);

  if (repliesError) {
    console.error('Error deleting comment replies:', repliesError);
    throw new Error('返信の削除に失敗しました');
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error('コメントの削除に失敗しました');
  }
}
