/**
 * ClearPress AI - Realtime Subscription Hook
 * Reusable hook for managing Supabase Realtime channel subscriptions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ===== Types =====

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type RealtimeConnectionStatus =
  | 'SUBSCRIBED'
  | 'CONNECTING'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT'
  | 'CLOSED';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseRealtimeSubscriptionOptions<T extends { [key: string]: any }> {
  /** Unique channel name */
  channelName: string;

  /** Table to subscribe to */
  table: string;

  /** Event types to listen for */
  event: RealtimeEventType;

  /** Filter configuration (Supabase Realtime filter syntax, e.g., "user_id=eq.{userId}") */
  filter?: string;

  /** Query keys to invalidate on events */
  queryKeysToInvalidate: QueryKey[];

  /** Optional callback for custom event handling */
  onEvent?: (payload: RealtimePostgresChangesPayload<T>) => void;

  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
}

export interface UseRealtimeSubscriptionReturn {
  /** Current connection status */
  status: RealtimeConnectionStatus;

  /** Whether currently connected */
  isConnected: boolean;

  /** Manual reconnect function */
  reconnect: () => void;

  /** Unsubscribe function */
  unsubscribe: () => void;
}

// ===== Constants =====

const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
};

// ===== Hook =====

/**
 * Hook for managing Supabase Realtime channel subscriptions with TanStack Query integration
 *
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   channelName: 'notifications-user-123',
 *   table: 'notifications',
 *   event: 'INSERT',
 *   filter: 'user_id=eq.123',
 *   queryKeysToInvalidate: [notificationKeys.lists()],
 *   onEvent: (payload) => console.log('New notification:', payload.new),
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtimeSubscription<T extends { [key: string]: any }>({
  channelName,
  table,
  event,
  filter,
  queryKeysToInvalidate,
  onEvent,
  enabled = true,
}: UseRealtimeSubscriptionOptions<T>): UseRealtimeSubscriptionReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<RealtimeConnectionStatus>('CLOSED');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Check if subscription should be active
  const shouldSubscribe = enabled && !!user;

  // Handle incoming realtime events
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (!isMountedRef.current) return;

      // Invalidate specified query keys
      queryKeysToInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Call custom event handler if provided
      onEvent?.(payload);
    },
    [queryClient, queryKeysToInvalidate, onEvent]
  );

  // Create and subscribe to channel
  const subscribe = useCallback(() => {
    if (!shouldSubscribe) return;

    // Clean up existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStatus('CONNECTING');

    // Build subscription config
    const subscriptionConfig: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    // Create channel and subscribe
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        subscriptionConfig,
        (payload) => handleEvent(payload as RealtimePostgresChangesPayload<T>)
      )
      .subscribe((status, err) => {
        if (!isMountedRef.current) return;

        if (status === 'SUBSCRIBED') {
          setStatus('SUBSCRIBED');
          reconnectAttemptsRef.current = 0; // Reset on successful connection
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime channel error for ${channelName}:`, err);
          setStatus('CHANNEL_ERROR');
          scheduleReconnect();
        } else if (status === 'TIMED_OUT') {
          console.warn(`Realtime channel timed out for ${channelName}`);
          setStatus('TIMED_OUT');
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          setStatus('CLOSED');
        }
      });

    channelRef.current = channel;
  }, [shouldSubscribe, channelName, table, event, filter, handleEvent]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectAttemptsRef.current >= RECONNECT_CONFIG.maxAttempts) {
      console.warn(
        `Max reconnect attempts (${RECONNECT_CONFIG.maxAttempts}) reached for ${channelName}. ` +
        'Falling back to polling.'
      );
      return;
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay * Math.pow(2, reconnectAttemptsRef.current),
      RECONNECT_CONFIG.maxDelay
    );

    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        subscribe();
      }
    }, delay);
  }, [channelName, subscribe]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    subscribe();
  }, [subscribe]);

  // Unsubscribe function
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setStatus('CLOSED');
  }, []);

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    isMountedRef.current = true;

    if (shouldSubscribe) {
      subscribe();
    }

    return () => {
      isMountedRef.current = false;

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clean up channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shouldSubscribe, subscribe]);

  return {
    status,
    isConnected: status === 'SUBSCRIBED',
    reconnect,
    unsubscribe,
  };
}

export default useRealtimeSubscription;
