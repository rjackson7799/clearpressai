/**
 * ClearPress AI - Approvals Service
 * Operations for content approval workflow
 */

import { supabase } from './supabase';
import type { Approval, User, ContentStatus } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbApproval = Database['public']['Tables']['approvals']['Row'];

// Approval status type
export type ApprovalStatus = 'approved' | 'rejected' | 'changes_requested';

// ===== Type Converters =====

function dbApprovalToApproval(
  row: DbApproval & {
    user?: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
  }
): Approval {
  return {
    id: row.id,
    content_item_id: row.content_item_id,
    version_id: row.version_id,
    user_id: row.user_id,
    status: row.status as ApprovalStatus,
    feedback: row.feedback ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    user: row.user as User | undefined,
  };
}

// ===== Create Approval Data =====

export interface CreateApprovalData {
  content_item_id: string;
  version_id: string;
  status: ApprovalStatus;
  feedback?: string;
}

// ===== Approval CRUD =====

/**
 * Fetch all approvals for a content item
 */
export async function fetchApprovals(contentItemId: string): Promise<Approval[]> {
  const { data, error } = await supabase
    .from('approvals')
    .select(`
      *,
      user:users!approvals_user_id_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approvals:', error);
    throw new Error('承認履歴の取得に失敗しました');
  }

  return (data ?? []).map((row) =>
    dbApprovalToApproval({
      ...(row as unknown as DbApproval),
      user: row.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
    })
  );
}

/**
 * Fetch the latest approval for a content item
 */
export async function fetchLatestApproval(
  contentItemId: string
): Promise<Approval | null> {
  const { data, error } = await supabase
    .from('approvals')
    .select(`
      *,
      user:users!approvals_user_id_fkey(id, name, avatar_url)
    `)
    .eq('content_item_id', contentItemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest approval:', error);
    throw new Error('最新の承認情報の取得に失敗しました');
  }

  if (!data) return null;

  return dbApprovalToApproval({
    ...(data as unknown as DbApproval),
    user: data.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Create a new approval record and update content status
 */
export async function createApproval(
  data: CreateApprovalData,
  userId: string
): Promise<Approval> {
  // Insert approval record
  const { data: approval, error } = await supabase
    .from('approvals')
    .insert({
      content_item_id: data.content_item_id,
      version_id: data.version_id,
      user_id: userId,
      status: data.status,
      feedback: data.feedback,
    })
    .select(`
      *,
      user:users!approvals_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating approval:', error);
    throw new Error('承認の記録に失敗しました');
  }

  // Update content item status based on approval status
  let newContentStatus: ContentStatus;
  switch (data.status) {
    case 'approved':
      newContentStatus = 'approved';
      break;
    case 'rejected':
    case 'changes_requested':
      newContentStatus = 'needs_revision';
      break;
    default:
      newContentStatus = 'in_review';
  }

  const { error: updateError } = await supabase
    .from('content_items')
    .update({
      status: newContentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.content_item_id);

  if (updateError) {
    console.error('Error updating content status:', updateError);
    // Don't throw - approval was recorded successfully
  }

  return dbApprovalToApproval({
    ...(approval as unknown as DbApproval),
    user: approval.user as Pick<User, 'id' | 'name' | 'avatar_url'> | null,
  });
}

/**
 * Submit content for client review
 * Updates status to 'in_review' and optionally creates notification
 */
export async function submitForReview(
  contentItemId: string,
  versionId: string
): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .update({
      status: 'in_review' as ContentStatus,
      current_version_id: versionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentItemId);

  if (error) {
    console.error('Error submitting for review:', error);
    throw new Error('レビュー提出に失敗しました');
  }
}

/**
 * Get approval statistics for a content item
 */
export async function fetchApprovalStats(contentItemId: string): Promise<{
  total: number;
  approved: number;
  rejected: number;
  changes_requested: number;
}> {
  const { data, error } = await supabase
    .from('approvals')
    .select('status')
    .eq('content_item_id', contentItemId);

  if (error) {
    console.error('Error fetching approval stats:', error);
    throw new Error('承認統計の取得に失敗しました');
  }

  const stats = {
    total: data?.length ?? 0,
    approved: 0,
    rejected: 0,
    changes_requested: 0,
  };

  data?.forEach((item) => {
    if (item.status === 'approved') stats.approved++;
    else if (item.status === 'rejected') stats.rejected++;
    else if (item.status === 'changes_requested') stats.changes_requested++;
  });

  return stats;
}
