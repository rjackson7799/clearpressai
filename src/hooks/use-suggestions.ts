/**
 * ClearPress AI - Suggestions Hooks
 * TanStack Query hooks for client suggestion operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSuggestions,
  fetchPendingSuggestions,
  fetchPendingSuggestionCount,
  createSuggestion,
  acceptSuggestion,
  rejectSuggestion,
  deleteSuggestion,
  fetchSuggestionStats,
  type CreateSuggestionData,
} from '@/services/suggestions';
import { toast } from 'sonner';

// ===== Query Keys =====

export const suggestionKeys = {
  all: ['suggestions'] as const,
  lists: () => [...suggestionKeys.all, 'list'] as const,
  list: (contentItemId: string) => [...suggestionKeys.lists(), contentItemId] as const,
  pending: (contentItemId: string) =>
    [...suggestionKeys.all, 'pending', contentItemId] as const,
  pendingCount: (contentItemId: string) =>
    [...suggestionKeys.all, 'pending-count', contentItemId] as const,
  stats: (contentItemId: string) =>
    [...suggestionKeys.all, 'stats', contentItemId] as const,
};

// ===== Hooks =====

/**
 * Fetch all suggestions for a content item
 */
export function useSuggestions(contentItemId: string | undefined) {
  return useQuery({
    queryKey: suggestionKeys.list(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchSuggestions(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch pending suggestions for a content item
 */
export function usePendingSuggestions(contentItemId: string | undefined) {
  return useQuery({
    queryKey: suggestionKeys.pending(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchPendingSuggestions(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch pending suggestion count for a content item
 */
export function usePendingSuggestionCount(contentItemId: string | undefined) {
  return useQuery({
    queryKey: suggestionKeys.pendingCount(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchPendingSuggestionCount(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch suggestion statistics for a content item
 */
export function useSuggestionStats(contentItemId: string | undefined) {
  return useQuery({
    queryKey: suggestionKeys.stats(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchSuggestionStats(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new suggestion
 */
export function useCreateSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: CreateSuggestionData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createSuggestion(data, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.list(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pending(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pendingCount(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.stats(variables.content_item_id),
      });
      toast.success('編集提案を追加しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Accept a suggestion
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: {
      suggestionId: string;
      contentItemId: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return acceptSuggestion(params.suggestionId, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pending(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pendingCount(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.stats(variables.contentItemId),
      });
      toast.success('提案を承認しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Reject a suggestion
 */
export function useRejectSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: {
      suggestionId: string;
      contentItemId: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return rejectSuggestion(params.suggestionId, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pending(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pendingCount(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.stats(variables.contentItemId),
      });
      toast.success('提案を拒否しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a suggestion (only pending and owned by user)
 */
export function useDeleteSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: {
      suggestionId: string;
      contentItemId: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return deleteSuggestion(params.suggestionId, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pending(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.pendingCount(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: suggestionKeys.stats(variables.contentItemId),
      });
      toast.success('提案を削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
