/**
 * ContentItemList - List of content items for a project
 */

import { useState } from 'react';
import { ContentItemCard } from './ContentItemCard';
import { CreateContentDialog } from './CreateContentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentItems, useDeleteContentItem } from '@/hooks/use-content';
import type { ContentType, ContentStatus, ContentFilters } from '@/types';
import { Plus, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItemListProps {
  projectId: string;
  onEditContent: (contentId: string) => void;
}

const CONTENT_TYPES: ContentType[] = [
  'press_release',
  'blog_post',
  'social_media',
  'internal_memo',
  'faq',
  'executive_statement',
];

const CONTENT_STATUSES: ContentStatus[] = [
  'draft',
  'submitted',
  'in_review',
  'needs_revision',
  'approved',
];

export function ContentItemList({ projectId, onEditContent }: ContentItemListProps) {
  const { t } = useLanguage();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ContentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useContentItems(projectId, {
    ...filters,
    search: searchQuery || undefined,
  });

  const deleteContentMutation = useDeleteContentItem();

  const handleDelete = (contentId: string) => {
    if (window.confirm(t('editor.deleteConfirm'))) {
      deleteContentMutation.mutate({ contentItemId: contentId, projectId });
    }
  };

  const handleContentCreated = (contentId: string) => {
    setCreateDialogOpen(false);
    onEditContent(contentId);
    toast.success(t('content.newContent') + '作成しました');
  };

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('common.error')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('content.title')}</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('content.newContent')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.type?.[0] ?? 'all'}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              type: value === 'all' ? undefined : [value as ContentType],
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('content.contentType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {CONTENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`content.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status?.[0] ?? 'all'}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: value === 'all' ? undefined : [value as ContentStatus],
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('projects.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {CONTENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`content.status_${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[160px]" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((content) => (
            <ContentItemCard
              key={content.id}
              content={content}
              onEdit={onEditContent}
              onDelete={handleDelete}
              isLocked={!!content.locked_by}
              lockedByName={(content as unknown as { locked_by_user?: { name: string } }).locked_by_user?.name}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data && data.total > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('clients.showing')
            .replace('{from}', String((data.page - 1) * data.per_page + 1))
            .replace('{to}', String(Math.min(data.page * data.per_page, data.total)))
            .replace('{total}', String(data.total))}
        </div>
      )}

      {/* Create dialog */}
      <CreateContentDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleContentCreated}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">{t('editor.emptyTitle')}</h3>
      <p className="text-muted-foreground mb-4">{t('editor.emptyDescription')}</p>
      <Button onClick={onCreateClick} className="gap-2">
        <Plus className="h-4 w-4" />
        {t('content.newContent')}
      </Button>
    </div>
  );
}
