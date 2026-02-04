/**
 * ClearPress AI - Notifications Realtime Hook
 * Real-time subscription for notification updates
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './use-realtime-subscription';
import { notificationKeys } from './use-notifications';
import type { Notification } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ===== Types =====

export interface UseNotificationsRealtimeOptions {
  /** Called when a new notification arrives */
  onNewNotification?: (notification: Notification) => void;

  /** Whether to show toast on new notification (default: false) */
  showToast?: boolean;

  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
}

export interface UseNotificationsRealtimeReturn {
  /** Whether currently connected to realtime */
  isConnected: boolean;

  /** Manual reconnect function */
  reconnect: () => void;
}

// ===== Hook =====

/**
 * Hook for real-time notification updates
 *
 * @example
 * ```tsx
 * // Basic usage
 * useNotificationsRealtime();
 *
 * // With toast notifications
 * useNotificationsRealtime({ showToast: true });
 *
 * // With custom handler
 * useNotificationsRealtime({
 *   onNewNotification: (notification) => {
 *     console.log('New notification:', notification.title);
 *   },
 * });
 * ```
 */
export function useNotificationsRealtime({
  onNewNotification,
  showToast = false,
  enabled = true,
}: UseNotificationsRealtimeOptions = {}): UseNotificationsRealtimeReturn {
  const { user } = useAuth();

  // Handle new notification event
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<Notification>) => {
      if (payload.eventType !== 'INSERT') return;

      const newNotification = payload.new as Notification;

      // Defense in depth: verify the notification is for the current user
      if (newNotification.user_id !== user?.id) {
        console.warn('Received notification for different user, ignoring');
        return;
      }

      // Show toast notification if enabled
      if (showToast && newNotification.title) {
        toast(newNotification.title, {
          description: newNotification.body || undefined,
        });
      }

      // Call custom handler if provided
      onNewNotification?.(newNotification);
    },
    [user?.id, showToast, onNewNotification]
  );

  // Subscribe to notifications table
  const { isConnected, reconnect } = useRealtimeSubscription<Notification>({
    channelName: `notifications-${user?.id || 'anonymous'}`,
    table: 'notifications',
    event: 'INSERT',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    queryKeysToInvalidate: [
      notificationKeys.lists(),
      notificationKeys.unreadCount(user?.id ?? ''),
    ],
    onEvent: handleEvent,
    enabled: enabled && !!user?.id,
  });

  return {
    isConnected,
    reconnect,
  };
}

export default useNotificationsRealtime;
