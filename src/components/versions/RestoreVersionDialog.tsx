/**
 * RestoreVersionDialog - Confirmation dialog for restoring a version
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import type { ContentVersion } from '@/types';
import { RotateCcw, Clock, User, FileText, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { getPlainText } from './VersionDiff';

interface RestoreVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: ContentVersion | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RestoreVersionDialog({
  open,
  onOpenChange,
  version,
  onConfirm,
  isLoading = false,
}: RestoreVersionDialogProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ja' ? ja : enUS;

  if (!version) return null;

  // Extract created_by_user from version
  const createdByUser = (version as unknown as { created_by_user?: {
    id: string;
    name: string;
  } }).created_by_user;

  // Get preview text (first 300 characters)
  const contentPreview = getPlainText(version.content).slice(0, 300);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t('versions.restoreVersion')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('versions.restoreDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Version info card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-3">
            {/* Version header */}
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

            {/* Version metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(version.created_at), 'PPp', { locale: dateLocale })}
              </span>
              {createdByUser && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {createdByUser.name}
                </span>
              )}
              {version.word_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {version.word_count.toLocaleString()} {t('versions.wordCount')}
                </span>
              )}
            </div>

            <Separator />

            {/* Content preview */}
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 text-xs">Preview:</p>
              <p className="line-clamp-4 whitespace-pre-wrap">
                {contentPreview}
                {contentPreview.length >= 300 && '...'}
              </p>
            </div>
          </CardContent>
        </Card>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? t('common.loading') : t('versions.restore')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
