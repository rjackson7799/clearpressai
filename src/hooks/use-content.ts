/**
 * ClearPress AI - Content Hooks
 * TanStack Query hooks for content item operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchContentItems,
  fetchContentItem,
  createContentItem,
  updateContentItem,
  updateContentStatus,
  deleteContentItem,
  lockContentItem,
  unlockContentItem,
  forceUnlockContentItem,
  fetchContentStats,
  fetchPendingContentForClient,
  fetchAllContentItems,
  duplicateContentItem,
  type AllContentFilters,
} from '@/services/content';
import type {
  ContentStatus,
  ContentType,
  ContentFilters,
  ContentSettings,
} from '@/types';
import { toast } from 'sonner';

// ===== Query Keys =====

export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (projectId: string, filters?: ContentFilters & { page?: number }) =>
    [...contentKeys.lists(), projectId, filters] as const,
  allOrg: (orgId: string, filters?: AllContentFilters) =>
    [...contentKeys.lists(), 'all-org', orgId, filters] as const,
  pendingForClient: (clientId: string) =>
    [...contentKeys.lists(), 'pending', clientId] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  stats: (projectId: string) => [...contentKeys.all, 'stats', projectId] as const,
};

// ===== Hooks =====

/**
 * Fetch content items for a project
 */
export function useContentItems(
  projectId: string | undefined,
  filters?: ContentFilters & { page?: number; per_page?: number }
) {
  return useQuery({
    queryKey: contentKeys.list(projectId ?? '', filters),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID required');
      return fetchContentItems(projectId, filters);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all content items across all projects in the organization
 */
export function useAllContentItems(filters?: AllContentFilters) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: contentKeys.allOrg(organizationId ?? '', filters),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization ID required');
      return fetchAllContentItems(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single content item by ID
 */
export function useContentItem(contentItemId: string | undefined) {
  return useQuery({
    queryKey: contentKeys.detail(contentItemId ?? ''),
    queryFn: () => {
      if (!contentItemId) throw new Error('Content Item ID required');
      return fetchContentItem(contentItemId);
    },
    enabled: !!contentItemId,
    staleTime: 15 * 1000, // Shorter stale time for editor
  });
}

/**
 * Create a new content item
 */
export function useCreateContentItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: {
        type: ContentType;
        title: string;
        settings?: ContentSettings;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createContentItem(projectId, data, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.list(variables.projectId),
      });
      toast.success('コンテンツを作成しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update an existing content item
 */
export function useUpdateContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentItemId,
      data,
    }: {
      contentItemId: string;
      data: {
        title?: string;
        settings?: ContentSettings;
        current_version_id?: string;
      };
    }) => updateContentItem(contentItemId, data),
    onSuccess: (contentItem, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      // Also invalidate the project's content list
      if (contentItem.project_id) {
        queryClient.invalidateQueries({
          queryKey: contentKeys.list(contentItem.project_id),
        });
      }
      toast.success('コンテンツを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update content item status
 */
export function useUpdateContentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentItemId,
      status,
    }: {
      contentItemId: string;
      status: ContentStatus;
    }) => updateContentStatus(contentItemId, status),
    onSuccess: (contentItem, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(variables.contentItemId),
      });
      if (contentItem.project_id) {
        queryClient.invalidateQueries({
          queryKey: contentKeys.list(contentItem.project_id),
        });
        queryClient.invalidateQueries({
          queryKey: contentKeys.stats(contentItem.project_id),
        });
      }
      toast.success('ステータスを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a content item
 */
export function useDeleteContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentItemId }: { contentItemId: string; projectId: string }) =>
      deleteContentItem(contentItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.list(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.stats(variables.projectId),
      });
      // Also invalidate the org-wide content list (used by /pr/content page)
      queryClient.invalidateQueries({
        queryKey: contentKeys.lists(),
      });
      toast.success('コンテンツを削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Lock a content item for editing
 */
export function useLockContentItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (contentItemId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return lockContentItem(contentItemId, user.id);
    },
    onSuccess: (_, contentItemId) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(contentItemId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Unlock a content item
 */
export function useUnlockContentItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (contentItemId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return unlockContentItem(contentItemId, user.id);
    },
    onSuccess: (_, contentItemId) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(contentItemId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Force unlock a content item (admin only)
 */
export function useForceUnlockContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentItemId: string) => forceUnlockContentItem(contentItemId),
    onSuccess: (_, contentItemId) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.detail(contentItemId),
      });
      toast.success('ロックを強制解除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch content statistics for a project
 */
export function useContentStats(projectId: string | undefined) {
  return useQuery({
    queryKey: contentKeys.stats(projectId ?? ''),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID required');
      return fetchContentStats(projectId);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch pending content for client review (Client Portal)
 */
export function usePendingContentForClient(clientId: string | undefined) {
  return useQuery({
    queryKey: contentKeys.pendingForClient(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchPendingContentForClient(clientId);
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  });
}

/**
 * Duplicate a content item with its current version
 */
export function useDuplicateContentItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contentItemId: string) => {
      if (!user?.id) throw new Error('ログインが必要です');
      return duplicateContentItem(contentItemId, user.id);
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({
        queryKey: contentKeys.list(newItem.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: contentKeys.stats(newItem.project_id),
      });
      toast.success('コンテンツを複製しました');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'コンテンツの複製に失敗しました');
    },
  });
}
