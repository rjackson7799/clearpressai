/**
 * ClearPress AI - Notifications Service
 * Operations for user notifications
 */

import { supabase } from './supabase';
import type { Notification, NotificationType } from '@/types';
import type { Database } from '@/types/database';

// Database row type
type DbNotification = Database['public']['Tables']['notifications']['Row'];

// ===== Type Converters =====

function dbNotificationToNotification(row: DbNotification): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    metadata: row.metadata as Notification['metadata'] ?? undefined,
    read: row.read ?? false,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

// ===== Create Notification Data =====

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: {
    project_id?: string;
    content_item_id?: string;
    link?: string;
  };
}

// ===== Notification CRUD =====

/**
 * Fetch all notifications for a user
 */
export async function fetchNotifications(
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq('read', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('通知の取得に失敗しました');
  }

  return (data ?? []).map(dbNotificationToNotification);
}

/**
 * Fetch unread notification count for a user
 */
export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    throw new Error('未読数の取得に失敗しました');
  }

  return count ?? 0;
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('通知の既読処理に失敗しました');
  }

  return dbNotificationToNotification(data);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('全ての通知の既読処理に失敗しました');
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.user_id,
      type: data.type as Database['public']['Enums']['notification_type'],
      title: data.title,
      body: data.body,
      metadata: data.metadata as unknown as Database['public']['Tables']['notifications']['Insert']['metadata'],
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('通知の作成に失敗しました');
  }

  return dbNotificationToNotification(notification);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error('通知の削除に失敗しました');
  }
}

/**
 * Delete all read notifications for a user (cleanup)
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('read', true);

  if (error) {
    console.error('Error deleting read notifications:', error);
    throw new Error('既読通知の削除に失敗しました');
  }
}

// ===== Notification Helpers =====

/**
 * Create notification for content submitted for review
 */
export async function notifyContentSubmitted(
  userId: string,
  contentTitle: string,
  projectId: string,
  contentItemId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'content_submitted',
    title: 'レビュー依頼',
    body: `「${contentTitle}」のレビューをお願いします。`,
    metadata: {
      project_id: projectId,
      content_item_id: contentItemId,
      link: `/client/projects/${projectId}/content/${contentItemId}`,
    },
  });
}

/**
 * Create notification for content approved
 */
export async function notifyContentApproved(
  userId: string,
  contentTitle: string,
  projectId: string,
  contentItemId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'content_approved',
    title: '承認されました',
    body: `「${contentTitle}」が承認されました。`,
    metadata: {
      project_id: projectId,
      content_item_id: contentItemId,
      link: `/pr/projects/${projectId}/content/${contentItemId}`,
    },
  });
}

/**
 * Create notification for comment added
 */
export async function notifyCommentAdded(
  userId: string,
  commenterName: string,
  contentTitle: string,
  projectId: string,
  contentItemId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'comment_added',
    title: '新しいコメント',
    body: `${commenterName}さんが「${contentTitle}」にコメントしました。`,
    metadata: {
      project_id: projectId,
      content_item_id: contentItemId,
    },
  });
}

/**
 * Create notification for approval needed
 */
export async function notifyApprovalNeeded(
  userId: string,
  contentTitle: string,
  projectId: string,
  contentItemId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'approval_needed',
    title: '承認が必要です',
    body: `「${contentTitle}」の承認をお願いします。`,
    metadata: {
      project_id: projectId,
      content_item_id: contentItemId,
      link: `/client/projects/${projectId}/content/${contentItemId}`,
    },
  });
}
