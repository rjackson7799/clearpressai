/**
 * ClearPress AI - Client Portal Dashboard
 * Precision Clarity Design System
 *
 * Hero welcome section with time-based greeting
 * Animated stats cards with counting effect
 * Pending items carousel
 */

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, CheckCircle, Clock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientDashboardStats, usePendingItems, useRecentProjects } from '@/hooks/use-client-dashboard';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// Get time-based greeting
function getGreeting(language: 'ja' | 'en'): string {
  const hour = new Date().getHours();

  if (language === 'ja') {
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  }

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Animated stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
  pulse = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant?: 'default' | 'pending' | 'approved';
  pulse?: boolean;
}) {
  const variantStyles = {
    default: 'bg-card',
    pending: [
      'bg-[oklch(95%_0.03_25)]',
      'border-l-4 border-[oklch(55%_0.18_25)]',
    ].join(' '),
    approved: [
      'bg-[oklch(94%_0.04_155)]',
      'border-l-4 border-[oklch(52%_0.14_155)]',
    ].join(' '),
  };

  const iconColors = {
    default: 'text-muted-foreground',
    pending: 'text-[oklch(55%_0.18_25)]',
    approved: 'text-[oklch(52%_0.14_155)]',
  };

  const valueColors = {
    default: 'text-foreground',
    pending: 'text-[oklch(42%_0.2_25)]',
    approved: 'text-[oklch(40%_0.14_155)]',
  };

  return (
    <Card
      variant="elevated"
      padding="compact"
      className={cn(
        variantStyles[variant],
        'animate-fade-up'
      )}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            className={cn(
              'h-4 w-4',
              iconColors[variant],
              pulse && 'animate-pulse-subtle'
            )}
          />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p
          className={cn(
            'text-3xl font-mono font-bold tabular-nums',
            valueColors[variant],
            'animate-count'
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// Empty state component with illustration
function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="py-12 text-center">
      <div className="relative inline-flex items-center justify-center mb-4">
        {/* Decorative background circle */}
        <div className="absolute w-20 h-20 rounded-full bg-muted/50" />
        <Icon className="relative h-10 w-10 text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground text-sm font-display">{message}</p>
    </div>
  );
}

// Content type labels
const contentTypeLabels = {
  ja: {
    press_release: 'プレスリリース',
    blog_post: 'ブログ記事',
    social_media: 'ソーシャルメディア',
    internal_memo: '社内文書',
    faq: 'FAQ',
    executive_statement: '経営者声明',
  },
  en: {
    press_release: 'Press Release',
    blog_post: 'Blog Post',
    social_media: 'Social Media',
    internal_memo: 'Internal Memo',
    faq: 'FAQ',
    executive_statement: 'Executive Statement',
  },
};

// Project status labels
const statusLabels = {
  ja: {
    requested: '依頼中',
    in_progress: '進行中',
    in_review: 'レビュー中',
    approved: '承認済み',
    completed: '完了',
    archived: 'アーカイブ',
  },
  en: {
    requested: 'Requested',
    in_progress: 'In Progress',
    in_review: 'In Review',
    approved: 'Approved',
    completed: 'Completed',
    archived: 'Archived',
  },
};

export function ClientDashboard() {
  const { language } = useLanguage();
  const { profile, user } = useAuth();

  const greeting = getGreeting(language);

  // Fetch real data using hooks
  const { data: stats, isLoading: statsLoading } = useClientDashboardStats(user?.id);
  const { data: pendingItems, isLoading: pendingLoading } = usePendingItems(user?.id);
  const { data: recentProjects, isLoading: projectsLoading } = useRecentProjects(user?.id);

  const pendingCount = stats?.pendingCount ?? 0;
  const approvedCount = stats?.approvedCount ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Section */}
      <section className="animate-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              {greeting}
            </p>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              {profile?.name}
            </h1>
            {profile?.organization && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {profile.organization.name}
              </p>
            )}
          </div>
          {/* Optional: Profile avatar placeholder */}
        </div>
      </section>

      {/* Stats Grid - Asymmetric layout */}
      <section className="grid grid-cols-2 gap-4 stagger-children">
        {statsLoading ? (
          <>
            <Card variant="elevated" padding="compact" className="animate-pulse">
              <CardContent className="pt-4 pb-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </CardContent>
            </Card>
            <Card variant="elevated" padding="compact" className="animate-pulse">
              <CardContent className="pt-4 pb-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatCard
              icon={Clock}
              label={language === 'ja' ? '承認待ち' : 'Pending'}
              value={pendingCount}
              variant={pendingCount > 0 ? 'pending' : 'default'}
              pulse={pendingCount > 0}
            />
            <StatCard
              icon={CheckCircle}
              label={language === 'ja' ? '承認済み' : 'Approved'}
              value={approvedCount}
              variant={approvedCount > 0 ? 'approved' : 'default'}
            />
          </>
        )}
      </section>

      {/* Pending Items Section */}
      <section className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-display font-semibold">
            {language === 'ja' ? '承認待ちのアイテム' : 'Pending Review'}
          </h2>
          <div className="flex-1 h-px bg-border" />
          {pendingCount > 0 && (
            <Badge variant="vermillion" size="sm">
              {pendingCount}
            </Badge>
          )}
        </div>

        <Card variant="elevated" padding="none">
          <CardContent className="py-0">
            {pendingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !pendingItems?.length ? (
              <EmptyState
                icon={Bell}
                message={
                  language === 'ja'
                    ? '承認待ちのアイテムはありません'
                    : 'No pending items'
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {pendingItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/client/projects/${item.projectId}/content/${item.id}`}
                    className="flex items-center justify-between py-4 px-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{contentTypeLabels[language][item.type as keyof typeof contentTypeLabels.ja] || item.type}</span>
                        <span>•</span>
                        <span className="truncate">{item.projectName}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Projects Section */}
      <section className="space-y-4 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-display font-semibold">
            {language === 'ja' ? '最近のプロジェクト' : 'Recent Projects'}
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Card variant="elevated" padding="none">
          <CardContent className="py-0">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !recentProjects?.length ? (
              <EmptyState
                icon={FileText}
                message={
                  language === 'ja'
                    ? 'プロジェクトはまだありません'
                    : 'No projects yet'
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/client/projects/${project.id}`}
                    className="flex items-center justify-between py-4 px-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{project.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{statusLabels[language][project.status as keyof typeof statusLabels.ja] || project.status}</span>
                        <span>•</span>
                        <span>
                          {project.contentCount} {language === 'ja' ? '件のコンテンツ' : 'items'}
                        </span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(project.updatedAt), {
                            addSuffix: true,
                            locale: language === 'ja' ? ja : undefined,
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default ClientDashboard;
