/**
 * ContentItemCard - Card component for displaying a content item
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentStatusBadge } from './ContentStatusBadge';
import { getContentTypeIcon } from '@/components/editor';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContentItem } from '@/types';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Lock,
  Clock,
  FileText,
  FolderOpen,
  Building2,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface ContentItemCardProps {
  content: ContentItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  isLocked?: boolean;
  lockedByName?: string;
  /** Project name to display when showing content across projects */
  projectName?: string;
  /** Client name to display when showing content across projects */
  clientName?: string;
}

export function ContentItemCard({
  content,
  onEdit,
  onDelete,
  onDuplicate,
  isLocked = false,
  lockedByName,
  projectName,
  clientName,
}: ContentItemCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ja' ? ja : enUS;

  const wordCount = content.current_version?.word_count ?? 0;
  const complianceScore = content.current_version?.compliance_score;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 text-muted-foreground">
              {getContentTypeIcon(content.type)}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{content.title}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`content.${content.type}`)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(content.id)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(content.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('content.duplicate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(content.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status and lock indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <ContentStatusBadge status={content.status} size="sm" />
          {isLocked && (
            <Badge variant="outline" className="gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200">
              <Lock className="h-3 w-3" />
              {lockedByName ? `${lockedByName}が編集中` : t('editor.locked')}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{wordCount} {t('content.wordCount')}</span>
          </div>
          {complianceScore !== undefined && (
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  complianceScore >= 80
                    ? 'bg-emerald-500'
                    : complianceScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
              <span>{complianceScore}%</span>
            </div>
          )}
        </div>

        {/* Client and project name (when showing cross-project content) */}
        {(clientName || projectName) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {clientName && (
              <div className="flex items-center gap-1 min-w-0">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{clientName}</span>
              </div>
            )}
            {projectName && (
              <div className="flex items-center gap-1 min-w-0">
                <FolderOpen className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{projectName}</span>
              </div>
            )}
          </div>
        )}

        {/* Updated time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(content.updated_at), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
