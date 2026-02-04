/**
 * ClearPress AI - Dashboard Stats Hook
 * Fetches real-time statistics for the PR Portal dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { fetchRecentActivity, calculateApprovalRate, type ActivityItem } from '@/services/settings';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (orgId: string) => [...dashboardKeys.all, 'stats', orgId] as const,
  activity: (orgId: string) => [...dashboardKeys.all, 'activity', orgId] as const,
  approvalRate: (orgId: string) => [...dashboardKeys.all, 'approvalRate', orgId] as const,
};

export interface DashboardStats {
  activeProjects: number;
  pendingContent: number;
  activeClients: number;
}

async function fetchDashboardStats(organizationId: string): Promise<DashboardStats> {
  // Run all count queries in parallel for better performance
  const [projectsResult, contentResult, clientsResult] = await Promise.all([
    // Count active projects (in_progress, in_review, requested)
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['in_progress', 'in_review', 'requested']),

    // Count content pending review (in_review status)
    supabase
      .from('content_items')
      .select('*, projects!inner(organization_id)', { count: 'exact', head: true })
      .eq('projects.organization_id', organizationId)
      .eq('status', 'in_review'),

    // Count active clients
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ]);

  return {
    activeProjects: projectsResult.count ?? 0,
    pendingContent: contentResult.count ?? 0,
    activeClients: clientsResult.count ?? 0,
  };
}

/**
 * Hook to fetch dashboard statistics for the current organization
 */
export function useDashboardStats() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: dashboardKeys.stats(organizationId ?? ''),
    queryFn: () => fetchDashboardStats(organizationId!),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute - stats don't need real-time updates
  });
}

/**
 * Hook to fetch recent activity for the dashboard
 */
export function useDashboardActivity(limit: number = 10) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery<ActivityItem[]>({
    queryKey: dashboardKeys.activity(organizationId ?? ''),
    queryFn: () => fetchRecentActivity(organizationId!, limit),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds - activity should be more fresh
  });
}

/**
 * Hook to fetch approval rate for the dashboard
 */
export function useDashboardApprovalRate() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery<number>({
    queryKey: dashboardKeys.approvalRate(organizationId ?? ''),
    queryFn: () => calculateApprovalRate(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - approval rate doesn't change frequently
  });
}
