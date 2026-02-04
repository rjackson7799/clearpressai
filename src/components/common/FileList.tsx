/**
 * ClearPress AI - File List Component
 * Displays a list of uploaded files with actions
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileImage,
  Download,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatFileSize } from '@/services/files';
import { useFileUrl, useDeleteFile } from '@/hooks/use-files';
import type { FileRecord, FileCategory, ExtractionStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface FileListProps {
  files: FileRecord[];
  isLoading?: boolean;
  showCategory?: boolean;
  showExtractionStatus?: boolean;
  canDelete?: boolean;
  onFileClick?: (file: FileRecord) => void;
  emptyMessage?: string;
  className?: string;
}

export function FileList({
  files,
  isLoading = false,
  showCategory = false,
  showExtractionStatus = false,
  canDelete = true,
  onFileClick,
  emptyMessage,
  className,
}: FileListProps) {
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          {emptyMessage || t('files.noFiles')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          showCategory={showCategory}
          showExtractionStatus={showExtractionStatus}
          canDelete={canDelete}
          onClick={onFileClick ? () => onFileClick(file) : undefined}
          language={language}
          t={t}
        />
      ))}
    </div>
  );
}

interface FileListItemProps {
  file: FileRecord;
  showCategory: boolean;
  showExtractionStatus: boolean;
  canDelete: boolean;
  onClick?: () => void;
  language: 'ja' | 'en';
  t: (key: string) => string;
}

function FileListItem({
  file,
  showCategory,
  showExtractionStatus,
  canDelete,
  onClick,
  language,
  t,
}: FileListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteFile = useDeleteFile();

  const handleDelete = async () => {
    await deleteFile.mutateAsync(file.id);
    setShowDeleteDialog(false);
  };

  const getFileIcon = () => {
    if (file.mime_type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getCategoryLabel = (category: FileCategory): string => {
    return t(`files.category.${category}`);
  };

  const getCategoryColor = (category: FileCategory): string => {
    const colors: Record<FileCategory, string> = {
      reference: 'bg-gray-100 text-gray-700',
      brand_guidelines: 'bg-purple-100 text-purple-700',
      tone_example: 'bg-blue-100 text-blue-700',
      previous_press_release: 'bg-green-100 text-green-700',
      style_reference: 'bg-amber-100 text-amber-700',
      asset: 'bg-cyan-100 text-cyan-700',
      export: 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getExtractionStatusIcon = (status?: ExtractionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(file.created_at), {
    addSuffix: true,
    locale: language === 'ja' ? ja : enUS,
  });

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white transition-colors',
          onClick && 'cursor-pointer hover:bg-gray-50'
        )}
        onClick={onClick}
      >
        {/* File Icon */}
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            {showExtractionStatus && file.extraction_status && (
              <span title={t(`files.extraction.${file.extraction_status}`)}>
                {getExtractionStatusIcon(file.extraction_status)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size_bytes)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {showCategory && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <Badge
                  variant="secondary"
                  className={cn('text-xs px-1.5 py-0', getCategoryColor(file.category))}
                >
                  {getCategoryLabel(file.category)}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <FileActions
            file={file}
            canDelete={canDelete}
            onDelete={() => setShowDeleteDialog(true)}
            t={t}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('files.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('files.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteFile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface FileActionsProps {
  file: FileRecord;
  canDelete: boolean;
  onDelete: () => void;
  t: (key: string) => string;
}

function FileActions({ file, canDelete, onDelete, t }: FileActionsProps) {
  const { data: downloadUrl } = useFileUrl(file.storage_path);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload} disabled={!downloadUrl}>
          <Download className="h-4 w-4 mr-2" />
          {t('files.download')}
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('files.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FileList;
