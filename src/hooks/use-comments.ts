/**
 * ClearPress AI - Comments Hooks
 * TanStack Query hooks for comment operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchComments,
  fetchUnresolvedCommentCount,
  createComment,
  updateComment,
  resolveComment,
  unresolveComment,
  deleteComment,
  type CreateCommentData,
} from '@/services/comments';
import { toast } from 'sonner';

// ===== Query Keys =====

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (contentItemId: string) => [...commentKeys.lists(), contentItemId] as const,
  unresolvedCount: (contentItemId: string) =>
    [...commentKeys.all, 'unresolved-count', contentItemId] as const,
};

// ===== Hooks =====

/**
 * Fetch comments for a content item
 */
export function useComments(contentItemId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.list(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchComments(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch unresolved comment count for a content item
 */
export function useUnresolvedCommentCount(contentItemId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.unresolvedCount(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchUnresolvedCommentCount(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: CreateCommentData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createComment(data, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.unresolvedCount(variables.content_item_id),
      });
      toast.success('コメントを投稿しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      content: string;
      contentItemId: string;
    }) => updateComment(params.commentId, params.content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.contentItemId),
      });
      toast.success('コメントを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Resolve a comment
 */
export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      contentItemId: string;
    }) => resolveComment(params.commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.unresolvedCount(variables.contentItemId),
      });
      toast.success('コメントを解決しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Unresolve a comment
 */
export function useUnresolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      contentItemId: string;
    }) => unresolveComment(params.commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.unresolvedCount(variables.contentItemId),
      });
      toast.success('コメントを再開しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      contentItemId: string;
    }) => deleteComment(params.commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.unresolvedCount(variables.contentItemId),
      });
      toast.success('コメントを削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
