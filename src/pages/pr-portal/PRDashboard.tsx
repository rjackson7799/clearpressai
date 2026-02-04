/**
 * ClearPress AI - PR Portal Dashboard
 * Main dashboard for PR Admin and Staff
 *
 * Design: Refined Corporate Japan aesthetic with clean whites,
 * warm accent colors, and generous whitespace
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats, useDashboardActivity, useDashboardApprovalRate } from '@/hooks/use-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sun,
  Sunset,
  Moon,
  Sparkles,
  FolderKanban,
  FileText,
  Users,
  TrendingUp,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  CircleDot,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ActivityItem } from '@/services/settings';

// Time-based greeting configuration
function getGreetingConfig(hour: number) {
  if (hour >= 5 && hour < 12) {
    return {
      jaGreeting: 'おはようございます',
      enGreeting: 'Good morning',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgGradient: 'from-amber-50 to-orange-50',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      jaGreeting: 'こんにちは',
      enGreeting: 'Good afternoon',
      icon: Sparkles,
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-50 to-sky-50',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      jaGreeting: 'お疲れ様です',
      enGreeting: 'Good evening',
      icon: Sunset,
      iconColor: 'text-orange-500',
      bgGradient: 'from-orange-50 to-rose-50',
    };
  } else {
    return {
      jaGreeting: 'お疲れ様です',
      enGreeting: 'Good evening',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgGradient: 'from-indigo-50 to-purple-50',
    };
  }
}

// Stat card configuration
interface StatCard {
  key: string;
  labelKey?: string;
  jaLabel?: string;
  enLabel?: string;
  jaSubtitle: string;
  enSubtitle: string;
  icon: typeof FolderKanban;
  iconBg: string;
  iconColor: string;
  value: number | string;
  suffix?: string;
  trend: null;
}

const STAT_CARDS: StatCard[] = [
  {
    key: 'projects',
    labelKey: 'nav.projects',
    jaSubtitle: '進行中のプロジェクト',
    enSubtitle: 'Active projects',
    icon: FolderKanban,
    iconBg: 'bg-[var(--color-stat-projects-light)]',
    iconColor: 'text-[var(--color-stat-projects)]',
    value: 0,
    trend: null,
  },
  {
    key: 'content',
    labelKey: 'content.title',
    jaSubtitle: 'レビュー待ち',
    enSubtitle: 'Pending review',
    icon: FileText,
    iconBg: 'bg-[var(--color-stat-content-light)]',
    iconColor: 'text-[var(--color-stat-content)]',
    value: 0,
    trend: null,
  },
  {
    key: 'clients',
    labelKey: 'nav.clients',
    jaSubtitle: 'アクティブなクライアント',
    enSubtitle: 'Active clients',
    icon: Users,
    iconBg: 'bg-[var(--color-stat-clients-light)]',
    iconColor: 'text-[var(--color-stat-clients)]',
    value: 0,
    trend: null,
  },
  {
    key: 'approval',
    jaLabel: '承認率',
    enLabel: 'Approval Rate',
    jaSubtitle: '今月の承認率',
    enSubtitle: 'This month',
    icon: TrendingUp,
    iconBg: 'bg-[var(--color-stat-approval-light)]',
    iconColor: 'text-[var(--color-stat-approval)]',
    value: '--',
    suffix: '%',
    trend: null,
  },
];

// Empty activity items for placeholder
const EMPTY_ACTIVITY_ITEMS = [
  {
    jaText: 'プロジェクトを作成して始めましょう',
    enText: 'Create a project to get started',
    icon: FolderKanban,
    type: 'hint',
  },
  {
    jaText: 'クライアントを追加できます',
    enText: 'Add clients to your organization',
    icon: Users,
    type: 'hint',
  },
  {
    jaText: 'コンテンツを生成してレビューを受けましょう',
    enText: 'Generate content and get reviews',
    icon: FileText,
    type: 'hint',
  },
];

// Activity type configuration
const activityConfig: Record<string, { icon: typeof FolderKanban; color: string; bgColor: string }> = {
  project_created: { icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  content_created: { icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  content_submitted: { icon: Edit3, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  content_approved: { icon: ThumbsUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  content_rejected: { icon: ThumbsDown, color: 'text-red-600', bgColor: 'bg-red-100' },
  comment_added: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export function PRDashboard() {
  const { t, language } = useLanguage();
  const { profile, isPRAdmin } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activityItems, isLoading: activityLoading } = useDashboardActivity(5);
  const { data: approvalRate, isLoading: approvalLoading } = useDashboardApprovalRate();

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreetingConfig(hour);
  }, []);

  const GreetingIcon = greeting.icon;

  // Get user initials
  const userInitials = useMemo(() => {
    if (!profile?.name) return 'U';
    return profile.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profile?.name]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-6 lg:p-8',
          'bg-gradient-to-br',
          greeting.bgGradient
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white/80 shadow-sm">
              <AvatarFallback className="bg-white text-gray-700 text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <GreetingIcon className={cn('h-4 w-4', greeting.iconColor)} />
                <span className="text-sm font-medium">
                  {language === 'ja' ? greeting.jaGreeting : greeting.enGreeting}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {profile?.name}
                <span className="text-gray-400 font-normal ml-1">
                  {language === 'ja' ? 'さん' : ''}
                </span>
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {profile?.organization?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="bg-white/80 text-gray-700 hover:bg-white"
            >
              {isPRAdmin ? 'Admin' : 'Staff'}
            </Badge>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          const label = stat.labelKey
            ? t(stat.labelKey)
            : language === 'ja'
            ? stat.jaLabel
            : stat.enLabel;

          // Get real value from stats based on card key
          const value =
            stat.key === 'projects'
              ? (stats?.activeProjects ?? 0)
              : stat.key === 'content'
                ? (stats?.pendingContent ?? 0)
                : stat.key === 'clients'
                  ? (stats?.activeClients ?? 0)
                  : stat.key === 'approval'
                    ? (approvalLoading ? '--' : (approvalRate ?? 0))
                    : stat.value;

          return (
            <Card
              key={stat.key}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <div className="flex items-baseline gap-1">
                      {statsLoading && stat.key !== 'approval' ? (
                        <span className="text-3xl font-bold text-gray-300 tracking-tight animate-pulse">
                          --
                        </span>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900 tracking-tight">
                          {value}
                        </span>
                      )}
                      {stat.suffix && (
                        <span className="text-lg text-gray-400">{stat.suffix}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {language === 'ja' ? stat.jaSubtitle : stat.enSubtitle}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
                      stat.iconBg
                    )}
                  >
                    <Icon className={cn('h-5 w-5', stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                {language === 'ja' ? '最近のアクティビティ' : 'Recent Activity'}
              </CardTitle>
              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                {language === 'ja' ? 'すべて見る' : 'View all'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !activityItems?.length ? (
              <>
                {/* Empty state with helpful hints */}
                <div className="space-y-4">
                  {EMPTY_ACTIVITY_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/70 border border-dashed border-gray-200"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                          <Icon className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600">
                            {language === 'ja' ? item.jaText : item.enText}
                          </p>
                        </div>
                        <CircleDot className="h-4 w-4 text-gray-300" />
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-center text-sm text-gray-500">
                    {language === 'ja'
                      ? 'アクティビティがここに表示されます'
                      : 'Your activity will appear here'}
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {activityItems.map((item) => {
                  const config = activityConfig[item.type] || {
                    icon: CircleDot,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-100'
                  };
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50/70 transition-colors"
                    >
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0',
                        config.bgColor
                      )}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {item.userName}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(item.createdAt), {
                              addSuffix: true,
                              locale: language === 'ja' ? ja : undefined,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Info Panel */}
        <div className="space-y-6">
          {/* Organization Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                {t('auth.organizationName')}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.organization?.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ja'
                      ? 'PR会社として登録されています'
                      : 'Registered as PR firm'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {language === 'ja' ? 'アカウント有効' : 'Account active'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                {language === 'ja' ? 'プロフィール' : 'Profile'}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {profile?.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {language === 'ja' ? '役割' : 'Role'}
                    </p>
                    <Badge variant="outline" className="font-medium">
                      {isPRAdmin ? 'Admin' : 'Staff'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {language === 'ja' ? 'ステータス' : 'Status'}
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {language === 'ja' ? 'アクティブ' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PRDashboard;
