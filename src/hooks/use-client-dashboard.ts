/**
 * ClearPress AI - Client Dashboard Hooks
 * TanStack Query hooks for client dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import {
  getClientIdForUser,
  fetchClientStats,
  fetchPendingItems,
  fetchRecentProjects,
  type ClientDashboardStats,
  type PendingItem,
  type RecentProject,
} from '@/services/client-dashboard';

// ===== Query Keys =====

export const clientDashboardKeys = {
  all: ['client-dashboard'] as const,
  clientId: (userId: string) => [...clientDashboardKeys.all, 'client-id', userId] as const,
  stats: (userId: string) => [...clientDashboardKeys.all, 'stats', userId] as const,
  pending: (userId: string) => [...clientDashboardKeys.all, 'pending', userId] as const,
  recentProjects: (userId: string) => [...clientDashboardKeys.all, 'recent-projects', userId] as const,
};

// ===== Hooks =====

/**
 * Get the client_id for the current user
 */
export function useClientId(userId: string | undefined) {
  return useQuery<string | null>({
    queryKey: clientDashboardKeys.clientId(userId || ''),
    queryFn: () => getClientIdForUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - client_id rarely changes
  });
}

/**
 * Fetch dashboard stats (pending and approved counts)
 */
export function useClientDashboardStats(userId: string | undefined) {
  const { data: clientId } = useClientId(userId);

  return useQuery<ClientDashboardStats>({
    queryKey: clientDashboardKeys.stats(userId || ''),
    queryFn: () => fetchClientStats(clientId!),
    enabled: !!clientId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

/**
 * Fetch pending items for review
 */
export function usePendingItems(userId: string | undefined, limit: number = 5) {
  const { data: clientId } = useClientId(userId);

  return useQuery<PendingItem[]>({
    queryKey: clientDashboardKeys.pending(userId || ''),
    queryFn: () => fetchPendingItems(clientId!, limit),
    enabled: !!clientId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Fetch recent projects
 */
export function useRecentProjects(userId: string | undefined, limit: number = 5) {
  const { data: clientId } = useClientId(userId);

  return useQuery<RecentProject[]>({
    queryKey: clientDashboardKeys.recentProjects(userId || ''),
    queryFn: () => fetchRecentProjects(clientId!, limit),
    enabled: !!clientId,
    staleTime: 60 * 1000, // 1 minute
  });
}
