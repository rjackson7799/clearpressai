/**
 * ClearPress AI - Comments Realtime Hook
 * Real-time subscription for comment updates during collaborative review
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './use-realtime-subscription';
import { commentKeys } from './use-comments';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ===== Types =====

// Database row type for comments (uses snake_case)
interface CommentRow {
  id: string;
  content_item_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  quoted_text: string | null;
  text_range_start: number | null;
  text_range_end: number | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseCommentsRealtimeOptions {
  /** Content item ID to filter comments for */
  contentItemId: string;

  /** Called when a new comment is added */
  onNewComment?: (comment: CommentRow) => void;

  /** Called when a comment is updated */
  onCommentUpdate?: (comment: CommentRow) => void;

  /** Called when a comment is deleted */
  onCommentDelete?: (commentId: string) => void;

  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
}

export interface UseCommentsRealtimeReturn {
  /** Whether currently connected to realtime */
  isConnected: boolean;

  /** Manual reconnect function */
  reconnect: () => void;
}

// ===== Hook =====

/**
 * Hook for real-time comment updates during collaborative content review
 *
 * @example
 * ```tsx
 * // Basic usage - just invalidates queries on changes
 * useCommentsRealtime({ contentItemId: 'content-123' });
 *
 * // With custom handlers
 * useCommentsRealtime({
 *   contentItemId: 'content-123',
 *   onNewComment: (comment) => {
 *     if (comment.user_id !== currentUserId) {
 *       toast.info('New comment from another user');
 *     }
 *   },
 * });
 * ```
 */
export function useCommentsRealtime({
  contentItemId,
  onNewComment,
  onCommentUpdate,
  onCommentDelete,
  enabled = true,
}: UseCommentsRealtimeOptions): UseCommentsRealtimeReturn {
  const { user } = useAuth();

  // Handle comment events
  const handleEvent = useCallback(
    (payload: RealtimePostgresChangesPayload<CommentRow>) => {
      switch (payload.eventType) {
        case 'INSERT': {
          const newComment = payload.new as CommentRow;
          // Only trigger callback for comments from other users
          if (newComment.user_id !== user?.id) {
            onNewComment?.(newComment);
          }
          break;
        }
        case 'UPDATE': {
          const updatedComment = payload.new as CommentRow;
          onCommentUpdate?.(updatedComment);
          break;
        }
        case 'DELETE': {
          const deletedComment = payload.old as CommentRow;
          if (deletedComment?.id) {
            onCommentDelete?.(deletedComment.id);
          }
          break;
        }
      }
    },
    [user?.id, onNewComment, onCommentUpdate, onCommentDelete]
  );

  // Subscribe to comments table for this content item
  const { isConnected, reconnect } = useRealtimeSubscription<CommentRow>({
    channelName: `comments-${contentItemId}`,
    table: 'comments',
    event: '*', // Listen for INSERT, UPDATE, DELETE
    filter: `content_item_id=eq.${contentItemId}`,
    queryKeysToInvalidate: [
      commentKeys.list(contentItemId),
      commentKeys.unresolvedCount(contentItemId),
    ],
    onEvent: handleEvent,
    enabled: enabled && !!contentItemId,
  });

  return {
    isConnected,
    reconnect,
  };
}

export default useCommentsRealtime;
