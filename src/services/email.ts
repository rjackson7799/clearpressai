/**
 * ClearPress AI - Email Service
 * Frontend wrapper for send-notification Edge Function
 */

import { supabase } from './supabase';
import type { NotificationType } from '@/types';

// ===== Types =====

export interface NotificationMetadata {
  project_id?: string;
  content_item_id?: string;
  link?: string;
  // Additional data for email templates
  project_name?: string;
  content_title?: string;
  content_type?: string;
  client_name?: string;
  urgency?: string;
  deadline?: string;
  commenter_name?: string;
  comment_excerpt?: string;
  submitter_name?: string;
  approver_name?: string;
  hours_remaining?: number;
}

export interface SendNotificationRequest {
  user_ids: string[];
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
  send_email?: boolean;
}

export interface SendNotificationResponse {
  success: boolean;
  notifications_created: number;
  emails_sent: number;
  emails_skipped: number;
  failures?: { user_id: string; reason: string }[];
  error?: {
    code: string;
    message: string;
  };
}

// ===== Core Function =====

/**
 * Send notification to multiple users (in-app + optional email)
 */
export async function sendNotification(
  request: SendNotificationRequest
): Promise<SendNotificationResponse> {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: request,
  });

  if (error) {
    console.error('Error calling send-notification:', error);
    throw new Error('通知の送信に失敗しました');
  }

  return data as SendNotificationResponse;
}

// ===== Helper Functions =====

/**
 * Send notification when content is submitted for review
 */
export async function sendContentSubmittedNotification(params: {
  userIds: string[];
  contentTitle: string;
  contentType: string;
  projectId: string;
  projectName: string;
  contentItemId: string;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'content_submitted',
    title: 'レビュー依頼',
    body: `「${params.contentTitle}」のレビューをお願いします。`,
    metadata: {
      project_id: params.projectId,
      content_item_id: params.contentItemId,
      link: `/client/projects/${params.projectId}/content/${params.contentItemId}`,
      project_name: params.projectName,
      content_title: params.contentTitle,
      content_type: params.contentType,
    },
    send_email: params.sendEmail ?? true,
  });
}

/**
 * Send notification when content is approved
 */
export async function sendContentApprovedNotification(params: {
  userIds: string[];
  contentTitle: string;
  projectId: string;
  projectName: string;
  contentItemId: string;
  approverName: string;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'content_approved',
    title: '承認されました',
    body: `「${params.contentTitle}」が承認されました。`,
    metadata: {
      project_id: params.projectId,
      content_item_id: params.contentItemId,
      link: `/pr/projects/${params.projectId}/content/${params.contentItemId}`,
      project_name: params.projectName,
      content_title: params.contentTitle,
      approver_name: params.approverName,
    },
    send_email: params.sendEmail ?? true,
  });
}

/**
 * Send notification when a comment is added
 */
export async function sendCommentNotification(params: {
  userIds: string[];
  commenterName: string;
  contentTitle: string;
  commentExcerpt: string;
  projectId: string;
  contentItemId: string;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'comment_added',
    title: '新しいコメント',
    body: `${params.commenterName}さんが「${params.contentTitle}」にコメントしました。`,
    metadata: {
      project_id: params.projectId,
      content_item_id: params.contentItemId,
      commenter_name: params.commenterName,
      content_title: params.contentTitle,
      comment_excerpt: params.commentExcerpt.substring(0, 100),
    },
    send_email: params.sendEmail ?? true,
  });
}

/**
 * Send notification when approval is needed
 */
export async function sendApprovalNeededNotification(params: {
  userIds: string[];
  contentTitle: string;
  projectId: string;
  projectName: string;
  contentItemId: string;
  submitterName: string;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'approval_needed',
    title: '承認が必要です',
    body: `「${params.contentTitle}」の承認をお願いします。`,
    metadata: {
      project_id: params.projectId,
      content_item_id: params.contentItemId,
      link: `/client/projects/${params.projectId}/content/${params.contentItemId}`,
      project_name: params.projectName,
      content_title: params.contentTitle,
      submitter_name: params.submitterName,
    },
    send_email: params.sendEmail ?? true,
  });
}

/**
 * Send notification when a new project is requested
 */
export async function sendProjectRequestNotification(params: {
  userIds: string[];
  projectName: string;
  projectId: string;
  clientName: string;
  urgency: string;
  deadline?: string;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'project_request',
    title: '新しいプロジェクト',
    body: `「${params.projectName}」が${params.clientName}から依頼されました。`,
    metadata: {
      project_id: params.projectId,
      link: `/pr/projects/${params.projectId}`,
      project_name: params.projectName,
      client_name: params.clientName,
      urgency: params.urgency,
      deadline: params.deadline,
    },
    send_email: params.sendEmail ?? true,
  });
}

/**
 * Send deadline reminder notification
 */
export async function sendDeadlineReminderNotification(params: {
  userIds: string[];
  projectName: string;
  projectId: string;
  deadline: string;
  hoursRemaining: number;
  sendEmail?: boolean;
}): Promise<SendNotificationResponse> {
  return sendNotification({
    user_ids: params.userIds,
    type: 'deadline_reminder',
    title: '締め切りが近づいています',
    body: `プロジェクト「${params.projectName}」の締め切りまであと${params.hoursRemaining}時間です。`,
    metadata: {
      project_id: params.projectId,
      link: `/pr/projects/${params.projectId}`,
      project_name: params.projectName,
      deadline: params.deadline,
      hours_remaining: params.hoursRemaining,
    },
    send_email: params.sendEmail ?? true,
  });
}
