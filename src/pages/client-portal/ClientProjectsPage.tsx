/**
 * ClearPress AI - Client Portal Projects Page
 * Precision Clarity Design System
 *
 * Segmented filter control with animated indicator
 * Elevated project cards with status borders
 * Smooth hover and press animations
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClientIdForUser } from '@/hooks/use-clients';
import { useClientProjects } from '@/hooks/use-projects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Calendar,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types';

// Status configuration with new design tokens
const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: { ja: string; en: string };
    badgeVariant: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
  requested: {
    label: { ja: '依頼中', en: 'Requested' },
    badgeVariant: 'in-progress',
    borderColor: 'border-l-[oklch(58%_0.12_240)]',
    icon: FolderOpen,
  },
  in_progress: {
    label: { ja: '進行中', en: 'In Progress' },
    badgeVariant: 'in-progress',
    borderColor: 'border-l-[oklch(58%_0.12_240)]',
    icon: Clock,
  },
  in_review: {
    label: { ja: 'レビュー中', en: 'In Review' },
    badgeVariant: 'in-review',
    borderColor: 'border-l-[oklch(58%_0.14_290)]',
    icon: AlertCircle,
  },
  approved: {
    label: { ja: '承認済み', en: 'Approved' },
    badgeVariant: 'approved',
    borderColor: 'border-l-[oklch(52%_0.14_155)]',
    icon: CheckCircle,
  },
  completed: {
    label: { ja: '完了', en: 'Completed' },
    badgeVariant: 'completed',
    borderColor: 'border-l-[oklch(52%_0.14_155)]',
    icon: CheckCircle,
  },
  archived: {
    label: { ja: 'アーカイブ', en: 'Archived' },
    badgeVariant: 'draft',
    borderColor: 'border-l-gray-300',
    icon: FolderOpen,
  },
};

// Filter options for segmented control
const getFilterOptions = (language: 'ja' | 'en') => [
  { value: 'all', label: language === 'ja' ? '全て' : 'All' },
  { value: 'in_review', label: language === 'ja' ? 'レビュー' : 'Review' },
  { value: 'in_progress', label: language === 'ja' ? '進行中' : 'Active' },
  { value: 'completed', label: language === 'ja' ? '完了' : 'Done' },
];

// Empty state component
function EmptyState({ language }: { language: 'ja' | 'en' }) {
  return (
    <div className="py-16 text-center">
      <div className="relative inline-flex items-center justify-center mb-6">
        {/* Origami-inspired folder illustration */}
        <div className="absolute w-24 h-24 rounded-2xl bg-muted/30 rotate-6" />
        <div className="absolute w-24 h-24 rounded-2xl bg-muted/50 -rotate-3" />
        <FolderOpen className="relative h-12 w-12 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground font-display">
        {language === 'ja'
          ? 'プロジェクトはまだありません'
          : 'No projects yet'}
      </p>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="space-y-4 stagger-children">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ClientProjectsPage() {
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get client ID for the current user
  const { data: clientId, isLoading: isLoadingClientId } = useClientIdForUser();

  // Fetch projects for this client
  const filters = statusFilter !== 'all' ? { status: [statusFilter as ProjectStatus] } : undefined;
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error,
  } = useClientProjects(clientId ?? undefined, filters);

  const isLoading = isLoadingClientId || isLoadingProjects;
  const projects = projectsData?.data ?? [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive/60 mb-3" />
            <p className="text-muted-foreground font-display">
              {language === 'ja'
                ? 'プロジェクトの読み込みに失敗しました'
                : 'Failed to load projects'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientId) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-display">
              {language === 'ja'
                ? 'クライアントが設定されていません'
                : 'No client assigned'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with new request button and segmented filter */}
      <div className="flex flex-col gap-4 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            {language === 'ja' ? 'プロジェクト' : 'Projects'}
          </h1>
          <Button asChild size="sm">
            <Link to="/client/request-new">
              <Plus className="h-4 w-4 mr-1.5" />
              {language === 'ja' ? '新規リクエスト' : 'New Request'}
            </Link>
          </Button>
        </div>

        <div className="flex justify-end">
          <SegmentedControl
            options={getFilterOptions(language)}
            value={statusFilter}
            onValueChange={setStatusFilter}
            size="sm"
          />
        </div>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <Card variant="elevated">
          <CardContent>
            <EmptyState language={language} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 stagger-children">
          {projects.map((project, index) => {
            const statusConfig = STATUS_CONFIG[project.status];
            const StatusIcon = statusConfig.icon;
            const contentCount = (project as { content_items?: unknown[] }).content_items?.length ?? 0;

            return (
              <Link
                key={project.id}
                to={`/client/projects/${project.id}`}
                className="block animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card
                  variant="elevated"
                  padding="compact"
                  interactive
                  className={cn(
                    'border-l-4',
                    statusConfig.borderColor
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Status badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={statusConfig.badgeVariant as 'in-progress' | 'in-review' | 'approved' | 'completed' | 'draft'}
                            size="sm"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label[language]}
                          </Badge>
                        </div>

                        {/* Project name */}
                        <h3 className="font-display font-semibold text-lg truncate mb-1">
                          {project.name}
                        </h3>

                        {/* Brief description */}
                        {project.brief && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {project.brief}
                          </p>
                        )}

                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="font-mono">{contentCount}</span>
                            <span>
                              {language === 'ja' ? 'コンテンツ' : 'items'}
                            </span>
                          </span>

                          {project.target_date && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="font-mono">
                                {new Date(project.target_date).toLocaleDateString(
                                  language === 'ja' ? 'ja-JP' : 'en-US',
                                  { month: 'short', day: 'numeric' }
                                )}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination info */}
      {projectsData && projectsData.total > 0 && (
        <p className="text-center text-sm text-muted-foreground font-mono animate-fade-up">
          {language === 'ja'
            ? `${projectsData.total}件のプロジェクト`
            : `${projectsData.total} project${projectsData.total !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}

export default ClientProjectsPage;
