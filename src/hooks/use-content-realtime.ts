/**
 * ClearPress AI - Content Realtime Hook
 * Real-time subscription for content item status and lock changes
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './use-realtime-subscription';
import { contentKeys } from './use-content';
import type { ContentStatus } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ===== Types =====

// Database row type for content_items (uses snake_case)
interface ContentItemRow {
  id: string;
  project_id: string;
  type: string;
  title: string;
  content: string | null;
  status: ContentStatus;
  locked_by: string | null;
  locked_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  settings: unknown;
}

export interface UseContentRealtimeOptions {
  /** Content item ID to subscribe to (for single content view/edit) */
  contentItemId?: string;

  /** Project ID to subscribe to (for project content list view) */
  projectId?: string;

  /** Called when content status changes */
  onStatusChange?: (
    contentItem: ContentItemRow,
    oldStatus: ContentStatus,
    newStatus: ContentStatus
  ) => void;

  /** Called when content lock changes (locked or unlocked) */
  onLockChange?: (
    contentItem: ContentItemRow,
    lockedBy: string | null
  ) => void;

  /** Called when content is updated by another user */
  onContentUpdate?: (contentItem: ContentItemRow) => void;

  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
}

export interface UseContentRealtimeReturn {
  /** Whether currently connected to realtime */
  isConnected: boolean;

  /** Manual reconnect function */
  reconnect: () => void;
}

// ===== Hook =====

/**
 * Hook for real-time content item updates (status changes, lock broadcasts)
 *
 * @example
 * ```tsx
 * // For content editor - watch single content item
 * useContentRealtime({
 *   contentItemId: 'content-123',
 *   onLockChange: (item, lockedBy) => {
 *     if (lockedBy && lockedBy !== user.id) {
 *       toast.warning('Another user is now editing this content');
 *     }
 *   },
 * });
 *
 * // For project view - watch all content in project
 * useContentRealtime({
 *   projectId: 'project-456',
 *   onStatusChange: (item, old, new_) => {
 *     if (new_ === 'approved') {
 *       toast.success(`"${item.title}" has been approved`);
 *     }
 *   },
 * });
 * ```
 */
export function useContentRealtime({
  contentItemId,
  projectId,
  onStatusChange,
  onLockChange,
  onContentUpdate,
  enabled = true,
}: UseContentRealtimeOptions): UseContentRealtimeReturn {
  const { user } = useAuth();

  // Determine filter based on provided IDs
  const filter = contentItemId
    ? `id=eq.${contentItemId}`
    : projectId
    ? `project_id=eq.${projectId}`
    : undefined;

  // Determine channel name
  const channelName = contentItemId
    ? `content-item-${contentItemId}`
    : projectId
    ? `content-project-${projectId}`
    : 'content-global';

  // Build query keys to invalidate
  const queryKeysToInvalidate = [];
  if (contentItemId) {
    queryKeysToInvalidate.push(contentKeys.detail(contentItemId));
  }
  if (projectId) {
    queryKeysToInvalidate.push(contentKeys.lists());
  }

  // Handle content item events
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<ContentItemRow>) => {
      if (payload.eventType !== 'UPDATE') return;

      const oldItem = payload.old as ContentItemRow;
      const newItem = payload.new as ContentItemRow;

      // Skip updates from the current user (they already see their changes)
      if (newItem.locked_by === user?.id) {
        return;
      }

      // Check for status change
      if (oldItem.status !== newItem.status && onStatusChange) {
        onStatusChange(newItem, oldItem.status, newItem.status);
      }

      // Check for lock change
      if (oldItem.locked_by !== newItem.locked_by && onLockChange) {
        onLockChange(newItem, newItem.locked_by);
      }

      // General content update callback
      onContentUpdate?.(newItem);
    },
    [user?.id, onStatusChange, onLockChange, onContentUpdate]
  );

  // Subscribe to content_items table
  const { isConnected, reconnect } = useRealtimeSubscription<ContentItemRow>({
    channelName,
    table: 'content_items',
    event: 'UPDATE',
    filter,
    queryKeysToInvalidate,
    onEvent: handleEvent,
    enabled: enabled && !!(contentItemId || projectId),
  });

  return {
    isConnected,
    reconnect,
  };
}

export default useContentRealtime;
