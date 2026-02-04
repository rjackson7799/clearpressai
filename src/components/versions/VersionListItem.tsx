/**
 * VersionListItem - Reusable version row component for version history
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import type { ContentVersion } from '@/types';
import {
  MoreHorizontal,
  Star,
  Clock,
  RotateCcw,
  GitCompare,
  StarOff,
  FileText,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VersionListItemProps {
  version: ContentVersion;
  isActive?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onSelect?: () => void;
  onCheckboxChange?: (checked: boolean) => void;
  onRestore?: () => void;
  onCompare?: () => void;
  onSetMilestone?: () => void;
  onRemoveMilestone?: () => void;
}

export function VersionListItem({
  version,
  isActive = false,
  isSelected = false,
  selectionMode = false,
  onSelect,
  onCheckboxChange,
  onRestore,
  onCompare,
  onSetMilestone,
  onRemoveMilestone,
}: VersionListItemProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ja' ? ja : enUS;

  // Extract created_by_user from version (added via select relation)
  const createdByUser = (version as unknown as { created_by_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  } }).created_by_user;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const complianceColor = version.compliance_score
    ? version.compliance_score >= 80
      ? 'bg-emerald-500'
      : version.compliance_score >= 60
      ? 'bg-amber-500'
      : 'bg-red-500'
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isActive && 'bg-muted border border-border',
        isSelected && 'bg-primary/5 border border-primary/20'
      )}
    >
      {/* Checkbox for comparison selection */}
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onCheckboxChange}
          className="shrink-0"
        />
      )}

      {/* Main content - clickable area */}
      <button
        onClick={onSelect}
        className="flex-1 text-left min-w-0"
        type="button"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm shrink-0">
              {formatTranslation(t('versions.versionNumber'), { number: version.version_number })}
            </span>
            {version.is_milestone && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 gap-1 shrink-0">
                <Star className="h-3 w-3 fill-current" />
                <span className="truncate max-w-[80px]">{version.milestone_name}</span>
              </Badge>
            )}
            {isActive && (
              <Badge variant="outline" className="text-xs shrink-0">
                {t('versions.current')}
              </Badge>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
          {/* Timestamp */}
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            <span title={format(new Date(version.created_at), 'PPpp', { locale: dateLocale })}>
              {formatDistanceToNow(new Date(version.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </span>

          {/* Creator */}
          {createdByUser && (
            <span className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-4 w-4">
                <AvatarImage src={createdByUser.avatar_url} />
                <AvatarFallback className="text-[8px]">
                  {getInitials(createdByUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{createdByUser.name}</span>
            </span>
          )}

          {/* Word count */}
          {version.word_count > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <FileText className="h-3 w-3" />
              {version.word_count.toLocaleString()}
            </span>
          )}

          {/* Compliance score indicator */}
          {complianceColor && (
            <span className="flex items-center gap-1 shrink-0">
              <div className={cn('h-2 w-2 rounded-full', complianceColor)} />
              {version.compliance_score}%
            </span>
          )}
        </div>
      </button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onCompare && (
            <DropdownMenuItem onClick={onCompare}>
              <GitCompare className="h-4 w-4 mr-2" />
              {t('versions.compare')}
            </DropdownMenuItem>
          )}
          {onRestore && !isActive && (
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('versions.restore')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {version.is_milestone ? (
            onRemoveMilestone && (
              <DropdownMenuItem onClick={onRemoveMilestone}>
                <StarOff className="h-4 w-4 mr-2" />
                {t('versions.removeMilestone')}
              </DropdownMenuItem>
            )
          ) : (
            onSetMilestone && (
              <DropdownMenuItem onClick={onSetMilestone}>
                <Star className="h-4 w-4 mr-2" />
                {t('versions.setMilestone')}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
