/**
 * ClearPress AI - Notifications Hooks
 * TanStack Query hooks for notification operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '@/services/notifications';
import { toast } from 'sonner';

// ===== Query Keys =====

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (userId: string, options?: { limit?: number; unreadOnly?: boolean }) =>
    [...notificationKeys.lists(), userId, options] as const,
  unreadCount: (userId: string) =>
    [...notificationKeys.all, 'unread-count', userId] as const,
};

// ===== Hooks =====

/**
 * Fetch notifications for the current user
 */
export function useNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.list(user?.id ?? '', options),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchNotifications(user.id, options);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch unread notification count for the current user
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(user?.id ?? ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchUnreadCount(user.id);
    },
    enabled: !!user?.id,
    staleTime: 15 * 1000, // Shorter stale time for count
    // Note: polling removed - using Supabase Realtime for instant updates
    // See use-notifications-realtime.ts
  });
}

/**
 * Mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      if (user?.id) {
        // Invalidate all notification queries for this user
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(user.id),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return markAllAsRead(user.id);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(user.id),
        });
      }
      toast.success('すべて既読にしました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(user.id),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete all read notifications (cleanup)
 */
export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return deleteReadNotifications(user.id);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
      }
      toast.success('既読通知を削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
