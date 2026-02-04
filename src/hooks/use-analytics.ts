/**
 * ClearPress AI - Analytics Hooks
 * TanStack Query hooks for analytics data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAnalyticsSummary,
  fetchProjectTrend,
  fetchProjectStatusDistribution,
  fetchProjectUrgencyDistribution,
  fetchProjectCompletionStats,
  fetchContentTypeDistribution,
  getDefaultDateRange,
  type AnalyticsDateRange,
} from '@/services/analytics';

// ===== Query Keys =====

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (orgId: string, range?: AnalyticsDateRange) =>
    [...analyticsKeys.all, 'summary', orgId, range] as const,
  projectTrend: (orgId: string, range?: AnalyticsDateRange) =>
    [...analyticsKeys.all, 'projectTrend', orgId, range] as const,
  statusDistribution: (orgId: string) =>
    [...analyticsKeys.all, 'statusDistribution', orgId] as const,
  urgencyDistribution: (orgId: string) =>
    [...analyticsKeys.all, 'urgencyDistribution', orgId] as const,
  completionStats: (orgId: string) =>
    [...analyticsKeys.all, 'completionStats', orgId] as const,
  contentTypeDistribution: (orgId: string) =>
    [...analyticsKeys.all, 'contentTypeDistribution', orgId] as const,
};

// ===== Hooks =====

/**
 * Hook to fetch analytics summary
 */
export function useAnalyticsSummary(dateRange?: AnalyticsDateRange) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.summary(organizationId ?? '', dateRange),
    queryFn: () => fetchAnalyticsSummary(organizationId!, dateRange),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch project trend data
 */
export function useProjectTrend(dateRange?: AnalyticsDateRange) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.projectTrend(organizationId ?? '', dateRange),
    queryFn: () => fetchProjectTrend(organizationId!, dateRange),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch project status distribution
 */
export function useProjectStatusDistribution() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.statusDistribution(organizationId ?? ''),
    queryFn: () => fetchProjectStatusDistribution(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch project urgency distribution
 */
export function useProjectUrgencyDistribution() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.urgencyDistribution(organizationId ?? ''),
    queryFn: () => fetchProjectUrgencyDistribution(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch project completion statistics
 */
export function useProjectCompletionStats() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.completionStats(organizationId ?? ''),
    queryFn: () => fetchProjectCompletionStats(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch content type distribution
 */
export function useContentTypeDistribution() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  return useQuery({
    queryKey: analyticsKeys.contentTypeDistribution(organizationId ?? ''),
    queryFn: () => fetchContentTypeDistribution(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Convenience hook for all analytics data
 */
export function useAnalytics(dateRange?: AnalyticsDateRange) {
  const range = dateRange ?? getDefaultDateRange();

  const summary = useAnalyticsSummary(range);
  const projectTrend = useProjectTrend(range);
  const statusDistribution = useProjectStatusDistribution();
  const urgencyDistribution = useProjectUrgencyDistribution();
  const completionStats = useProjectCompletionStats();
  const contentTypeDistribution = useContentTypeDistribution();

  const isLoading =
    summary.isLoading ||
    projectTrend.isLoading ||
    statusDistribution.isLoading ||
    urgencyDistribution.isLoading ||
    completionStats.isLoading ||
    contentTypeDistribution.isLoading;

  const isError =
    summary.isError ||
    projectTrend.isError ||
    statusDistribution.isError ||
    urgencyDistribution.isError ||
    completionStats.isError ||
    contentTypeDistribution.isError;

  return {
    summary: summary.data,
    projectTrend: projectTrend.data,
    statusDistribution: statusDistribution.data,
    urgencyDistribution: urgencyDistribution.data,
    completionStats: completionStats.data,
    contentTypeDistribution: contentTypeDistribution.data,
    isLoading,
    isError,
    refetch: () => {
      summary.refetch();
      projectTrend.refetch();
      statusDistribution.refetch();
      urgencyDistribution.refetch();
      completionStats.refetch();
      contentTypeDistribution.refetch();
    },
  };
}
