/**
 * ClearPress AI - Clients Hooks
 * TanStack Query hooks for client operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  deleteClient,
  fetchClientIndustries,
  updateClientIndustries,
  fetchClientUsers,
  addClientUser,
  removeClientUser,
  fetchAvailableClientUsers,
  fetchClientIdForUser,
  fetchClientsForUser,
  type ClientFilters,
} from '@/services/clients';
import type { StyleProfile } from '@/types';
import { toast } from 'sonner';

// ===== Query Keys =====

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters?: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  industries: (id: string) => [...clientKeys.detail(id), 'industries'] as const,
  users: (id: string) => [...clientKeys.detail(id), 'users'] as const,
  availableUsers: () => [...clientKeys.all, 'availableUsers'] as const,
  forUser: (userId: string) => [...clientKeys.all, 'forUser', userId] as const,
  idForUser: (userId: string) => [...clientKeys.all, 'idForUser', userId] as const,
};

// ===== Hooks =====

/**
 * Fetch clients list with filters
 */
export function useClients(filters?: ClientFilters) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchClients(organizationId, filters);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single client by ID
 */
export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchClient(clientId);
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      logo_url?: string;
      settings?: Record<string, unknown>;
      style_profile?: StyleProfile;
    }) => {
      if (!organizationId) throw new Error('Organization not found');
      return createClient(organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('クライアントを作成しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string;
      data: {
        name?: string;
        description?: string;
        logo_url?: string;
        settings?: Record<string, unknown>;
        style_profile?: StyleProfile;
      };
    }) => updateClient(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
      toast.success('クライアントを更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('クライアントを削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch industries for a client
 */
export function useClientIndustries(clientId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.industries(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchClientIndustries(clientId);
    },
    enabled: !!clientId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Update industries for a client
 */
export function useUpdateClientIndustries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      industryIds,
    }: {
      clientId: string;
      industryIds: string[];
    }) => updateClientIndustries(clientId, industryIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.industries(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
      toast.success('業界を更新しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch users for a client
 */
export function useClientUsers(clientId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.users(clientId ?? ''),
    queryFn: () => {
      if (!clientId) throw new Error('Client ID required');
      return fetchClientUsers(clientId);
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  });
}

/**
 * Add a user to a client
 */
export function useAddClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      userId,
    }: {
      clientId: string;
      userId: string;
    }) => addClientUser(clientId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.users(variables.clientId),
      });
      toast.success('ユーザーを追加しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Remove a user from a client
 */
export function useRemoveClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      userId,
    }: {
      clientId: string;
      userId: string;
    }) => removeClientUser(clientId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.users(variables.clientId),
      });
      toast.success('ユーザーを削除しました');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Fetch all available client_user role users in the organization
 * Used for adding users to clients
 */
export function useAvailableClientUsers() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: clientKeys.availableUsers(),
    queryFn: () => {
      if (!organizationId) throw new Error('Organization not found');
      return fetchAvailableClientUsers(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch the client ID for the current user (client_user)
 * Used in Client Portal to get the client context
 */
export function useClientIdForUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: clientKeys.idForUser(user?.id ?? ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchClientIdForUser(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - rarely changes
  });
}

/**
 * Fetch all clients for the current user (client_user can belong to multiple clients)
 * Used in Client Portal for client selection
 */
export function useClientsForUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: clientKeys.forUser(user?.id ?? ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchClientsForUser(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - rarely changes
  });
}
