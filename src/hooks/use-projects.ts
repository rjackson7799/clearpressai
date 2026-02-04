/**
 * ClearPress AI - Projects Hooks
 * TanStack Query hooks for project operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProjects,
  fetchProjectsByClient,
  fetchProject,
  createProject,
  createClientProjectRequest,
  updateProject,
  updateProjectStatus,
  deleteProject,
  fetchProjectStats,
  fetchClientProjectStats,
} from '@/services/projects';
import { fetchPRAdminIds } from '@/services/users';
import { sendProjectRequestNotification } from '@/services/email';
import type {
  ProjectStatus,
  UrgencyLevel,
  ExpandedBrief,
  ProjectFilters,
} from '@/types';
import { toast } from 'sonner';

// ===== Query Keys =====

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters & { page?: number; per_page?: number }) =>
    [...projectKeys.lists(), filters] as const,
  clientList: (clientId: string, filters?: { status?: ProjectStatus[]; page?: number }) =>
    [...projectKeys.lists(), 'client', clientId, filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
  orgStats: (orgId: string) => [...projectKeys.stats(), 'org', orgId] as const,
  clientStats: (clientId: string) => [...projectKeys.stats(), 'client', clientId] as const,
};

// ===== Hooks =====

/**
 * Fetch projects list with filters (PR Portal)
 */
export function useProjects(
  filters?: ProjectFilters & { page?: number; per_page?: number }
) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchProjects(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch projects for a specific client (Client Portal)
 */
export function useClientProjects(
  clientId: string | undefined,
  filters?: { status?: ProjectStatus[]; page?: number; per_page?: number }
) {
  return useQuery({
    queryKey: projectKeys.clientList(clientId ?? '', filters),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchProjectsByClient(clientId, filters);
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID required');
      return fetchProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const organizationId = profile?.organization_id;

  return useMutation({
    mutationFn: (data: {
      client_id: string;
      name: string;
      brief: string;
      urgency?: UrgencyLevel;
      target_date?: string;
      settings?: Record<string, unknown>;
    }) => {
      if (!organizationId) throw new Error('Organization not found');
      if (!user?.id) throw new Error('User not authenticated');
      return createProject(organizationId, data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('プロジェクトを作成しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: {
        name?: string;
        brief?: string;
        expanded_brief?: ExpandedBrief;
        urgency?: UrgencyLevel;
        target_date?: string;
        settings?: Record<string, unknown>;
      };
    }) => updateProject(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      toast.success('プロジェクトを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update project status
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: string;
      status: ProjectStatus;
    }) => updateProjectStatus(projectId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('ステータスを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('プロジェクトを削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch project statistics for the organization (PR Portal Dashboard)
 */
export function useProjectStats() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: projectKeys.orgStats(organizationId ?? ''),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchProjectStats(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch project statistics for a client (Client Portal Dashboard)
 */
export function useClientProjectStats(clientId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.clientStats(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchClientProjectStats(clientId);
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

// ===== Client Project Request =====

/**
 * Create a project request from the Client Portal.
 * This allows clients to initiate PR work requests directly.
 * Notifies PR admins when a request is submitted.
 */
export function useCreateClientProjectRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      clientName: string;
      name: string;
      brief: string;
      urgency?: UrgencyLevel;
      target_date?: string;
      content_type_hint?: string;
    }) => {
      if (!user?.id) throw new Error('ログインが必要です');

      // Create the project request
      const project = await createClientProjectRequest(
        data.clientId,
        {
          name: data.name,
          brief: data.brief,
          urgency: data.urgency,
          target_date: data.target_date,
          content_type_hint: data.content_type_hint,
        },
        user.id
      );

      // Get PR admins to notify
      // Need to fetch organization_id from the created project
      const orgId = project.organization_id;
      if (orgId) {
        const adminIds = await fetchPRAdminIds(orgId);
        if (adminIds.length > 0) {
          try {
            await sendProjectRequestNotification({
              userIds: adminIds,
              projectName: project.name,
              projectId: project.id,
              clientName: data.clientName,
              urgency: project.urgency ?? 'standard',
              deadline: project.target_date,
              sendEmail: true,
            });
          } catch (notifyError) {
            // Don't fail the request if notification fails
            console.error('Failed to send notification:', notifyError);
          }
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('リクエストを送信しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
