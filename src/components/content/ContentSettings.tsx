/**
 * ContentSettings - Sidebar panel for content metadata and settings
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentStatusBadge } from './ContentStatusBadge';
import { getContentTypeIcon } from '@/components/editor';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContentItem, ContentVersion } from '@/types';
import {
  FileText,
  Clock,
  History,
  Star,
  User,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContentSettingsProps {
  content: ContentItem | null | undefined;
  versions: ContentVersion[];
  isLoading?: boolean;
  onVersionSelect?: (versionId: string) => void;
  onViewAllVersions?: () => void;
  currentVersionId?: string;
}

export function ContentSettings({
  content,
  versions,
  isLoading = false,
  onVersionSelect,
  onViewAllVersions,
  currentVersionId,
}: ContentSettingsProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ja' ? ja : enUS;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  const wordCount = content.current_version?.word_count ?? 0;
  const complianceScore = content.current_version?.compliance_score;

  return (
    <div className="space-y-4 p-4 h-full overflow-y-auto">
      {/* Content Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('editor.contentInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('content.contentType')}</span>
            <div className="flex items-center gap-1.5">
              {getContentTypeIcon(content.type)}
              <span className="text-sm">{t(`content.${content.type}`)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('projects.status')}</span>
            <ContentStatusBadge status={content.status} size="sm" />
          </div>

          <Separator />

          {/* Word count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('content.wordCount')}</span>
            <span className="text-sm font-medium">{wordCount.toLocaleString()}</span>
          </div>

          {/* Compliance score */}
          {complianceScore !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('content.complianceScore')}</span>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    complianceScore >= 80
                      ? 'bg-emerald-500'
                      : complianceScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  )}
                />
                <span className="text-sm font-medium">{complianceScore}%</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Last updated */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('clients.updatedAt')}</span>
            <span className="text-sm">
              {formatDistanceToNow(new Date(content.updated_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('editor.versionHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('editor.noVersions')}
            </p>
          ) : (
            <div className="space-y-1">
              {versions.slice(0, 10).map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isActive={version.id === currentVersionId}
                  onClick={() => onVersionSelect?.(version.id)}
                  language={language}
                />
              ))}
              {onViewAllVersions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={onViewAllVersions}
                >
                  {t('editor.viewAllVersions')} ({versions.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface VersionItemProps {
  version: ContentVersion;
  isActive: boolean;
  onClick: () => void;
  language: 'ja' | 'en';
}

function VersionItem({ version, isActive, onClick, language }: VersionItemProps) {
  const dateLocale = language === 'ja' ? ja : enUS;
  const createdBy = (version as unknown as { created_by_user?: { name: string } }).created_by_user;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md transition-colors',
        'hover:bg-muted',
        isActive && 'bg-muted border border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">v{version.version_number}</span>
          {version.is_milestone && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1">
              <Star className="h-3 w-3" />
              {version.milestone_name}
            </Badge>
          )}
        </div>
        {isActive && (
          <Badge variant="outline" className="text-xs">
            現在
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(version.created_at), 'MM/dd HH:mm', { locale: dateLocale })}
        </span>
        {createdBy && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {createdBy.name}
          </span>
        )}
      </div>
    </button>
  );
}
