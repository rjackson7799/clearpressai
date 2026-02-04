/**
 * ClearPress AI - Analytics Service
 * Data fetching for project-focused analytics dashboard
 */

import { supabase } from './supabase';
import type { ProjectStatus, UrgencyLevel } from '@/types';

// ===== Types =====

export interface ProjectTrendDataPoint {
  date: string;
  total: number;
  completed: number;
  in_progress: number;
}

export interface ProjectStatusDistribution {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

export interface ProjectUrgencyDistribution {
  urgency: UrgencyLevel;
  count: number;
  percentage: number;
}

export interface ProjectCompletionStats {
  total_completed: number;
  avg_completion_days: number;
  on_time_percentage: number;
}

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

export interface AnalyticsSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_content_items: number;
  avg_compliance_score: number;
  projects_change_percent: number;
  content_change_percent: number;
}

// ===== Helper Functions =====

/**
 * Get date string in YYYY-MM-DD format
 */
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate array of date strings for a date range
 */
function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): AnalyticsDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  return {
    from: formatDateString(from),
    to: formatDateString(to),
  };
}

// ===== Analytics Fetchers =====

/**
 * Fetch analytics summary for an organization
 */
export async function fetchAnalyticsSummary(
  organizationId: string,
  dateRange?: AnalyticsDateRange
): Promise<AnalyticsSummary> {
  const range = dateRange ?? getDefaultDateRange();

  // Get previous period for comparison
  const currentFrom = new Date(range.from);
  const currentTo = new Date(range.to);
  const periodDays = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));
  const previousFrom = new Date(currentFrom);
  previousFrom.setDate(previousFrom.getDate() - periodDays);
  const previousTo = new Date(currentFrom);
  previousTo.setDate(previousTo.getDate() - 1);

  // Fetch current period projects
  const [currentProjectsResult, previousProjectsResult, contentResult, complianceResult] = await Promise.all([
    // Current period projects
    supabase
      .from('projects')
      .select('status')
      .eq('organization_id', organizationId)
      .gte('created_at', range.from)
      .lte('created_at', range.to),

    // Previous period projects (for comparison)
    supabase
      .from('projects')
      .select('status')
      .eq('organization_id', organizationId)
      .gte('created_at', formatDateString(previousFrom))
      .lte('created_at', formatDateString(previousTo)),

    // Total content items
    supabase
      .from('content_items')
      .select('*, projects!inner(organization_id)', { count: 'exact', head: true })
      .eq('projects.organization_id', organizationId),

    // Average compliance score
    supabase
      .from('content_versions')
      .select('compliance_score, content_items!inner(projects!inner(organization_id))')
      .eq('content_items.projects.organization_id', organizationId)
      .not('compliance_score', 'is', null),
  ]);

  const currentProjects = currentProjectsResult.data ?? [];
  const previousProjects = previousProjectsResult.data ?? [];

  const totalProjects = currentProjects.length;
  const activeProjects = currentProjects.filter(
    (p) => p.status && ['in_progress', 'in_review', 'requested'].includes(p.status)
  ).length;
  const completedProjects = currentProjects.filter(
    (p) => p.status === 'completed'
  ).length;

  // Calculate change percentages
  const projectsChangePercent = previousProjects.length > 0
    ? Math.round(((totalProjects - previousProjects.length) / previousProjects.length) * 100)
    : 0;

  // Calculate average compliance score
  let avgComplianceScore = 0;
  if (complianceResult.data && complianceResult.data.length > 0) {
    const scores = complianceResult.data
      .map((v) => v.compliance_score)
      .filter((s): s is number => s !== null);
    if (scores.length > 0) {
      avgComplianceScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  return {
    total_projects: totalProjects,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    total_content_items: contentResult.count ?? 0,
    avg_compliance_score: avgComplianceScore,
    projects_change_percent: projectsChangePercent,
    content_change_percent: 0, // Would need separate tracking
  };
}

/**
 * Fetch project trend data over time
 */
export async function fetchProjectTrend(
  organizationId: string,
  dateRange?: AnalyticsDateRange
): Promise<ProjectTrendDataPoint[]> {
  const range = dateRange ?? getDefaultDateRange();

  const { data, error } = await supabase
    .from('projects')
    .select('created_at, status, updated_at')
    .eq('organization_id', organizationId)
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project trend:', error);
    throw new Error('トレンドデータの取得に失敗しました');
  }

  // Group by date
  const dates = getDateRange(range.from, range.to);
  const trendMap = new Map<string, { total: number; completed: number; in_progress: number }>();

  // Initialize all dates
  dates.forEach((date) => {
    trendMap.set(date, { total: 0, completed: 0, in_progress: 0 });
  });

  // Aggregate data
  let runningTotal = 0;
  let runningCompleted = 0;
  let runningInProgress = 0;

  data?.forEach((project) => {
    const createdDate = project.created_at?.split('T')[0];
    if (createdDate && trendMap.has(createdDate)) {
      runningTotal++;
      if (project.status === 'completed') {
        runningCompleted++;
      } else if (['in_progress', 'in_review'].includes(project.status ?? '')) {
        runningInProgress++;
      }
    }
  });

  // Build cumulative trend
  runningTotal = 0;
  runningCompleted = 0;
  runningInProgress = 0;

  return dates.map((date) => {
    const dayData = data?.filter((p) => p.created_at?.split('T')[0] === date) ?? [];
    runningTotal += dayData.length;
    runningCompleted += dayData.filter((p) => p.status === 'completed').length;
    runningInProgress += dayData.filter((p) =>
      ['in_progress', 'in_review'].includes(p.status ?? '')
    ).length;

    return {
      date,
      total: runningTotal,
      completed: runningCompleted,
      in_progress: runningInProgress,
    };
  });
}

/**
 * Fetch project status distribution
 */
export async function fetchProjectStatusDistribution(
  organizationId: string
): Promise<ProjectStatusDistribution[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching status distribution:', error);
    throw new Error('ステータス分布の取得に失敗しました');
  }

  const statusCounts: Record<string, number> = {
    requested: 0,
    in_progress: 0,
    in_review: 0,
    approved: 0,
    completed: 0,
    archived: 0,
  };

  data?.forEach((project) => {
    if (project.status && statusCounts[project.status] !== undefined) {
      statusCounts[project.status]++;
    }
  });

  const total = data?.length ?? 0;

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status as ProjectStatus,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

/**
 * Fetch project urgency distribution
 */
export async function fetchProjectUrgencyDistribution(
  organizationId: string
): Promise<ProjectUrgencyDistribution[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('urgency')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching urgency distribution:', error);
    throw new Error('緊急度分布の取得に失敗しました');
  }

  const urgencyCounts: Record<string, number> = {
    standard: 0,
    priority: 0,
    urgent: 0,
    crisis: 0,
  };

  data?.forEach((project) => {
    if (project.urgency && urgencyCounts[project.urgency] !== undefined) {
      urgencyCounts[project.urgency]++;
    }
  });

  const total = data?.length ?? 0;

  return Object.entries(urgencyCounts).map(([urgency, count]) => ({
    urgency: urgency as UrgencyLevel,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

/**
 * Fetch project completion statistics
 */
export async function fetchProjectCompletionStats(
  organizationId: string
): Promise<ProjectCompletionStats> {
  const { data, error } = await supabase
    .from('projects')
    .select('created_at, updated_at, status, target_date')
    .eq('organization_id', organizationId)
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching completion stats:', error);
    throw new Error('完了統計の取得に失敗しました');
  }

  if (!data || data.length === 0) {
    return {
      total_completed: 0,
      avg_completion_days: 0,
      on_time_percentage: 0,
    };
  }

  // Calculate average completion days
  let totalDays = 0;
  let onTimeCount = 0;

  data.forEach((project) => {
    if (project.created_at && project.updated_at) {
      const created = new Date(project.created_at);
      const completed = new Date(project.updated_at);
      const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += days;

      // Check if completed on time
      if (project.target_date) {
        const target = new Date(project.target_date);
        if (completed <= target) {
          onTimeCount++;
        }
      }
    }
  });

  return {
    total_completed: data.length,
    avg_completion_days: Math.round(totalDays / data.length),
    on_time_percentage: data.length > 0 ? Math.round((onTimeCount / data.length) * 100) : 0,
  };
}

/**
 * Fetch content by type distribution
 */
export async function fetchContentTypeDistribution(
  organizationId: string
): Promise<{ type: string; count: number; percentage: number }[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('type, projects!inner(organization_id)')
    .eq('projects.organization_id', organizationId);

  if (error) {
    console.error('Error fetching content type distribution:', error);
    throw new Error('コンテンツタイプ分布の取得に失敗しました');
  }

  const typeCounts: Record<string, number> = {
    press_release: 0,
    blog_post: 0,
    social_media: 0,
    internal_memo: 0,
    faq: 0,
    executive_statement: 0,
  };

  data?.forEach((item) => {
    if (item.type && typeCounts[item.type] !== undefined) {
      typeCounts[item.type]++;
    }
  });

  const total = data?.length ?? 0;

  return Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}
