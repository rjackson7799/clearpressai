/**
 * VersionComparisonDialog - Side-by-side diff view for comparing versions
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import type { ContentVersion } from '@/types';
import { VersionDiff, useDiffStats } from './VersionDiff';
import {
  ArrowLeftRight,
  Star,
  Clock,
  User,
  GitCompare,
} from 'lucide-react';
import { format, type Locale } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VersionComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version1: ContentVersion | null; // Older version
  version2: ContentVersion | null; // Newer version
  onSwap?: () => void;
}

type DiffMode = 'inline' | 'side-by-side';

export function VersionComparisonDialog({
  open,
  onOpenChange,
  version1,
  version2,
  onSwap,
}: VersionComparisonDialogProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ja' ? ja : enUS;
  const [diffMode, setDiffMode] = useState<DiffMode>('inline');

  // Calculate diff stats
  const stats = useDiffStats(
    version1?.content ?? { plain_text: '' },
    version2?.content ?? { plain_text: '' }
  );

  if (!version1 || !version2) return null;

  // Extract created_by_user from versions
  const v1User = (version1 as unknown as { created_by_user?: { name: string } }).created_by_user;
  const v2User = (version2 as unknown as { created_by_user?: { name: string } }).created_by_user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            {t('versions.comparing')}
          </DialogTitle>
        </DialogHeader>

        {/* Version headers */}
        <div className="grid grid-cols-2 gap-4">
          <VersionHeader
            version={version1}
            label={t('versions.olderVersion')}
            userName={v1User?.name}
            dateLocale={dateLocale}
            t={t}
            className="border-l-2 border-red-500"
          />
          <VersionHeader
            version={version2}
            label={t('versions.newerVersion')}
            userName={v2User?.name}
            dateLocale={dateLocale}
            t={t}
            className="border-l-2 border-emerald-500"
          />
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">
                +{stats.additions} {t('versions.additions')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-600 dark:text-red-400">
                -{stats.deletions} {t('versions.deletions')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwap && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwap}
                className="gap-1"
              >
                <ArrowLeftRight className="h-4 w-4" />
                {t('versions.swapVersions')}
              </Button>
            )}
            <Tabs value={diffMode} onValueChange={(v) => setDiffMode(v as DiffMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="inline" className="text-xs px-3">
                  Inline
                </TabsTrigger>
                <TabsTrigger value="side-by-side" className="text-xs px-3">
                  Split
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Separator />

        {/* Diff content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="pr-4 pb-4">
            <VersionDiff
              oldContent={version1.content}
              newContent={version2.content}
              mode={diffMode}
              granularity="word"
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface VersionHeaderProps {
  version: ContentVersion;
  label: string;
  userName?: string;
  dateLocale: Locale;
  t: (key: string) => string;
  className?: string;
}

function VersionHeader({
  version,
  label,
  userName,
  dateLocale,
  t,
  className,
}: VersionHeaderProps) {
  return (
    <div className={cn('p-3 rounded-lg bg-muted/50 pl-4', className)}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {formatTranslation(t('versions.versionNumber'), { number: version.version_number })}
        </span>
        {version.is_milestone && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1">
            <Star className="h-3 w-3 fill-current" />
            {version.milestone_name}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(version.created_at), 'PP HH:mm', { locale: dateLocale })}
        </span>
        {userName && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {userName}
          </span>
        )}
      </div>
    </div>
  );
}
