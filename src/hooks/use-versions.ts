/**
 * ClearPress AI - Versions Hooks
 * TanStack Query hooks for content version operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchVersions,
  fetchVersion,
  createVersion,
  markMilestone,
  unmarkMilestone,
  setCurrentVersion,
  restoreVersion,
  getVersionsForComparison,
  fetchMilestones,
} from '@/services/versions';
import { contentKeys } from './use-content';
import type {
  StructuredContent,
  ComplianceDetails,
  GenerationParams,
} from '@/types';
import { toast } from 'sonner';

// ===== Query Keys =====

export const versionKeys = {
  all: ['versions'] as const,
  lists: () => [...versionKeys.all, 'list'] as const,
  list: (contentItemId: string) => [...versionKeys.lists(), contentItemId] as const,
  milestones: (contentItemId: string) =>
    [...versionKeys.list(contentItemId), 'milestones'] as const,
  details: () => [...versionKeys.all, 'detail'] as const,
  detail: (id: string) => [...versionKeys.details(), id] as const,
  comparison: (id1: string, id2: string) =>
    [...versionKeys.all, 'comparison', id1, id2] as const,
};

// ===== Hooks =====

/**
 * Fetch all versions for a content item
 */
export function useVersions(contentItemId: string | undefined) {
  return useQuery({
    queryKey: versionKeys.list(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchVersions(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single version by ID
 */
export function useVersion(versionId: string | undefined) {
  return useQuery({
    queryKey: versionKeys.detail(versionId ?? ''),
    queryFn: () => {
      if (!versionId) throw new Error('Version ID required');
      return fetchVersion(versionId);
    },
    enabled: !!versionId,
    staleTime: 60 * 1000, // Versions are immutable, longer stale time
  });
}

/**
 * Create a new version (used by auto-save and manual save)
 */
export function useCreateVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      contentItemId,
      data,
    }: {
      contentItemId: string;
      data: {
        content: StructuredContent;
        compliance_score?: number;
        compliance_details?: ComplianceDetails;
        word_count?: number;
        generation_params?: GenerationParams;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createVersion(contentItemId, data, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: versionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      // Don't show toast for auto-save (handled by auto-save hook)
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Create version with success toast (for manual save)
 */
export function useCreateVersionWithToast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      contentItemId,
      data,
    }: {
      contentItemId: string;
      data: {
        content: StructuredContent;
        compliance_score?: number;
        compliance_details?: ComplianceDetails;
        word_count?: number;
        generation_params?: GenerationParams;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createVersion(contentItemId, data, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: versionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      toast.success('保存しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Mark a version as a milestone
 */
export function useMarkMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      versionId,
      contentItemId: _contentItemId,
      milestoneName,
    }: {
      versionId: string;
      contentItemId: string;
      milestoneName: string;
    }) => {
      void _contentItemId; // Used for cache invalidation in onSuccess
      return markMilestone(versionId, milestoneName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: versionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: versionKeys.milestones(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: versionKeys.detail(variables.versionId),
      });
      toast.success('マイルストーンを設定しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Remove milestone mark from a version
 */
export function useUnmarkMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ versionId }: { versionId: string; contentItemId: string }) =>
      unmarkMilestone(versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: versionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: versionKeys.milestones(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: versionKeys.detail(variables.versionId),
      });
      toast.success('マイルストーンを解除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Set a version as the current version
 */
export function useSetCurrentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentItemId, versionId }: { contentItemId: string; versionId: string }) =>
      setCurrentVersion(contentItemId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      toast.success('現在のバージョンを設定しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Restore a previous version (creates new version with old content)
 */
export function useRestoreVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      versionId,
      contentItemId: _contentItemId,
    }: {
      versionId: string;
      contentItemId: string;
    }) => {
      void _contentItemId; // Used for cache invalidation in onSuccess
      if (!user?.id) throw new Error('User not authenticated');
      return restoreVersion(versionId, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: versionKeys.list(variables.contentItemId),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      toast.success('バージョンを復元しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch versions for comparison
 */
export function useVersionComparison(
  versionId1: string | undefined,
  versionId2: string | undefined
) {
  return useQuery({
    queryKey: versionKeys.comparison(versionId1 ?? '', versionId2 ?? ''),
    queryFn: () => {
      if (!versionId1 || !versionId2) {
        throw new Error('Both version IDs required for comparison');
      }
      return getVersionsForComparison(versionId1, versionId2);
    },
    enabled: !!versionId1 && !!versionId2,
    staleTime: 60 * 1000, // Versions are immutable
  });
}

/**
 * Fetch milestones for a content item
 */
export function useMilestones(contentItemId: string | undefined) {
  return useQuery({
    queryKey: versionKeys.milestones(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchMilestones(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 60 * 1000,
  });
}
