/**
 * ClearPress AI - Approvals Hooks
 * TanStack Query hooks for approval workflow operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchApprovals,
  fetchLatestApproval,
  createApproval,
  submitForReview,
  fetchApprovalStats,
  type CreateApprovalData,
} from '@/services/approvals';
import { contentKeys } from './use-content';
import { toast } from 'sonner';

// ===== Query Keys =====

export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (contentItemId: string) => [...approvalKeys.lists(), contentItemId] as const,
  latest: (contentItemId: string) =>
    [...approvalKeys.all, 'latest', contentItemId] as const,
  stats: (contentItemId: string) =>
    [...approvalKeys.all, 'stats', contentItemId] as const,
};

// ===== Hooks =====

/**
 * Fetch all approvals for a content item
 */
export function useApprovals(contentItemId: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.list(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchApprovals(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch the latest approval for a content item
 */
export function useLatestApproval(contentItemId: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.latest(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchLatestApproval(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch approval statistics for a content item
 */
export function useApprovalStats(contentItemId: string | undefined) {
  return useQuery({
    queryKey: approvalKeys.stats(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchApprovalStats(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new approval record
 */
export function useCreateApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<CreateApprovalData, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createApproval(data, user.id);
    },
    onSuccess: (approval, variables) => {
      // Invalidate approval queries
      queryClient.invalidateQueries({
        queryKey: approvalKeys.list(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: approvalKeys.latest(variables.content_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: approvalKeys.stats(variables.content_item_id),
      });
      // Also invalidate content item to refresh status
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.content_item_id),
      });

      // Show appropriate toast
      switch (approval.status) {
        case 'approved':
          toast.success('承認しました');
          break;
        case 'rejected':
          toast.success('却下しました');
          break;
        case 'changes_requested':
          toast.success('修正を依頼しました');
          break;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Approve content (convenience wrapper)
 */
export function useApproveContent() {
  const createApproval = useCreateApproval();

  return useMutation({
    mutationFn: ({
      contentItemId,
      versionId,
      feedback,
    }: {
      contentItemId: string;
      versionId: string;
      feedback?: string;
    }) =>
      createApproval.mutateAsync({
        content_item_id: contentItemId,
        version_id: versionId,
        status: 'approved',
        feedback,
      }),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Request changes on content (convenience wrapper)
 */
export function useRequestChanges() {
  const createApproval = useCreateApproval();

  return useMutation({
    mutationFn: ({
      contentItemId,
      versionId,
      feedback,
    }: {
      contentItemId: string;
      versionId: string;
      feedback: string;
    }) =>
      createApproval.mutateAsync({
        content_item_id: contentItemId,
        version_id: versionId,
        status: 'changes_requested',
        feedback,
      }),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Submit content for client review
 */
export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentItemId,
      versionId,
    }: {
      contentItemId: string;
      versionId: string;
      projectId?: string;
    }) => submitForReview(contentItemId, versionId),
    onSuccess: (_, variables) => {
      // Invalidate content item to refresh status
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      // Invalidate content list if project ID provided
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: contentKeys.list(variables.projectId),
        });
      }
      toast.success('レビューに提出しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
