/**
 * ClearPress AI - Email Hooks
 * TanStack Query hooks for email notifications
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  sendNotification,
  sendContentSubmittedNotification,
  sendContentApprovedNotification,
  sendCommentNotification,
  sendApprovalNeededNotification,
  sendProjectRequestNotification,
  sendDeadlineReminderNotification,
  type SendNotificationRequest,
  type SendNotificationResponse,
} from '@/services/email';
import { useLanguage } from '@/contexts/LanguageContext';

// ===== Query Keys =====

export const emailKeys = {
  all: ['email'] as const,
};

// ===== Generic Mutation Hook =====

/**
 * Generic hook for sending notifications
 */
export function useSendNotification() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (request: SendNotificationRequest) => sendNotification(request),
    onSuccess: (data: SendNotificationResponse) => {
      if (data.success) {
        // Only show toast if emails were actually sent
        if (data.emails_sent > 0) {
          toast.success(t('email.sent'));
        }
      } else if (data.error) {
        toast.error(data.error.message);
      }
    },
    onError: (error: Error) => {
      console.error('Send notification error:', error);
      toast.error(t('email.error'));
    },
  });
}

// ===== Specific Mutation Hooks =====

/**
 * Hook for sending content submitted notifications
 */
export function useSendContentSubmittedNotification() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      contentTitle: string;
      contentType: string;
      projectId: string;
      projectName: string;
      contentItemId: string;
      sendEmail?: boolean;
    }) => sendContentSubmittedNotification(params),
    onSuccess: (data: SendNotificationResponse) => {
      if (data.emails_sent > 0) {
        toast.success(t('email.reviewRequestSent'));
      }
    },
    onError: (error: Error) => {
      console.error('Send content submitted notification error:', error);
      // Silent fail - in-app notification may have succeeded
    },
  });
}

/**
 * Hook for sending content approved notifications
 */
export function useSendContentApprovedNotification() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      contentTitle: string;
      projectId: string;
      projectName: string;
      contentItemId: string;
      approverName: string;
      sendEmail?: boolean;
    }) => sendContentApprovedNotification(params),
    onSuccess: (data: SendNotificationResponse) => {
      if (data.emails_sent > 0) {
        toast.success(t('email.approvalNotificationSent'));
      }
    },
    onError: (error: Error) => {
      console.error('Send content approved notification error:', error);
    },
  });
}

/**
 * Hook for sending comment notifications
 */
export function useSendCommentNotification() {
  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      commenterName: string;
      contentTitle: string;
      commentExcerpt: string;
      projectId: string;
      contentItemId: string;
      sendEmail?: boolean;
    }) => sendCommentNotification(params),
    onError: (error: Error) => {
      console.error('Send comment notification error:', error);
      // Silent fail - comments should not fail due to notification issues
    },
  });
}

/**
 * Hook for sending approval needed notifications
 */
export function useSendApprovalNeededNotification() {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      contentTitle: string;
      projectId: string;
      projectName: string;
      contentItemId: string;
      submitterName: string;
      sendEmail?: boolean;
    }) => sendApprovalNeededNotification(params),
    onSuccess: (data: SendNotificationResponse) => {
      if (data.emails_sent > 0) {
        toast.success(t('email.approvalRequestSent'));
      }
    },
    onError: (error: Error) => {
      console.error('Send approval needed notification error:', error);
    },
  });
}

/**
 * Hook for sending project request notifications
 */
export function useSendProjectRequestNotification() {
  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      projectName: string;
      projectId: string;
      clientName: string;
      urgency: string;
      deadline?: string;
      sendEmail?: boolean;
    }) => sendProjectRequestNotification(params),
    onError: (error: Error) => {
      console.error('Send project request notification error:', error);
    },
  });
}

/**
 * Hook for sending deadline reminder notifications
 */
export function useSendDeadlineReminderNotification() {
  return useMutation({
    mutationFn: (params: {
      userIds: string[];
      projectName: string;
      projectId: string;
      deadline: string;
      hoursRemaining: number;
      sendEmail?: boolean;
    }) => sendDeadlineReminderNotification(params),
    onError: (error: Error) => {
      console.error('Send deadline reminder notification error:', error);
    },
  });
}
