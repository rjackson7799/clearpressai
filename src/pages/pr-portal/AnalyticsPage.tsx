/**
 * ClearPress AI - Analytics Page
 * Dashboard page showing project-focused analytics
 */

import { useState } from 'react';
import {
  FolderKanban,
  FileText,
  CheckCircle2,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  MetricCard,
  MetricGrid,
  ChartCard,
  DateRangeSelector,
  getDateRangeFromPreset,
  ProjectTrendChart,
  ProjectStatusChart,
  ProjectUrgencyChart,
  ContentTypeChart,
  type DateRangePreset,
} from '@/components/analytics';

export function AnalyticsPage() {
  const { t } = useLanguage();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d');

  const dateRange = getDateRangeFromPreset(dateRangePreset);
  const {
    summary,
    projectTrend,
    statusDistribution,
    urgencyDistribution,
    completionStats,
    contentTypeDistribution,
    isLoading,
    refetch,
  } = useAnalytics(dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('analytics.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector
            value={dateRangePreset}
            onChange={setDateRangePreset}
            className="w-40"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          title={t('analytics.totalProjects')}
          value={summary?.total_projects ?? 0}
          trend={summary?.projects_change_percent}
          icon={FolderKanban}
          loading={isLoading}
        />
        <MetricCard
          title={t('analytics.activeProjects')}
          value={summary?.active_projects ?? 0}
          description={t('analytics.activeProjectsDesc')}
          icon={Target}
          loading={isLoading}
        />
        <MetricCard
          title={t('analytics.completedProjects')}
          value={summary?.completed_projects ?? 0}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <MetricCard
          title={t('analytics.totalContent')}
          value={summary?.total_content_items ?? 0}
          icon={FileText}
          loading={isLoading}
        />
      </MetricGrid>

      {/* Completion Stats */}
      <MetricGrid columns={3}>
        <MetricCard
          title={t('analytics.avgCompletionDays')}
          value={completionStats?.avg_completion_days ?? 0}
          description={t('analytics.daysUnit')}
          loading={isLoading}
        />
        <MetricCard
          title={t('analytics.onTimeRate')}
          value={`${completionStats?.on_time_percentage ?? 0}%`}
          description={t('analytics.onTimeRateDesc')}
          loading={isLoading}
        />
        <MetricCard
          title={t('analytics.avgComplianceScore')}
          value={`${summary?.avg_compliance_score ?? 0}%`}
          description={t('analytics.avgComplianceScoreDesc')}
          loading={isLoading}
        />
      </MetricGrid>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t('analytics.projectTrend')}
          description={t('analytics.projectTrendDesc')}
          loading={isLoading}
          className="lg:col-span-2"
        >
          {projectTrend && <ProjectTrendChart data={projectTrend} height={300} />}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t('analytics.projectsByStatus')}
          description={t('analytics.projectsByStatusDesc')}
          loading={isLoading}
        >
          {statusDistribution && (
            <ProjectStatusChart data={statusDistribution} height={300} />
          )}
        </ChartCard>

        <ChartCard
          title={t('analytics.projectsByUrgency')}
          description={t('analytics.projectsByUrgencyDesc')}
          loading={isLoading}
        >
          {urgencyDistribution && (
            <ProjectUrgencyChart data={urgencyDistribution} height={300} />
          )}
        </ChartCard>
      </div>

      {/* Charts Row 3 */}
      <ChartCard
        title={t('analytics.contentByType')}
        description={t('analytics.contentByTypeDesc')}
        loading={isLoading}
      >
        {contentTypeDistribution && (
          <ContentTypeChart data={contentTypeDistribution} height={250} />
        )}
      </ChartCard>
    </div>
  );
}
