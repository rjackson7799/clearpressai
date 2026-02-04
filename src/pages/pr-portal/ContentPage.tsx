/**
 * ClearPress AI - Content Page
 * Unified view of all content items across projects
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllContentItems } from '@/hooks/use-content';
import { useProjects } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentItemCard, CreateContentDialog } from '@/components/content';
import { Plus, Search, FileText, Sparkles } from 'lucide-react';
import type { ContentType, ContentStatus } from '@/types';
import type { AllContentFilters, ContentItemWithProject } from '@/services/content';

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

// Extended filter type with pagination
interface ContentPageFilters extends AllContentFilters {
  page?: number;
  per_page?: number;
}

// Loading skeleton for the content grid
function ContentGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[180px] rounded-lg" />
      ))}
    </div>
  );
}

// Empty state component
function EmptyContentState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">{t('editor.emptyTitle')}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {t('editor.emptyDescription')}
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <Plus className="h-4 w-4" />
        {t('content.newContent')}
      </Button>
    </div>
  );
}

// Content filters component
function ContentFilters({
  filters,
  onFilterChange,
}: {
  filters: ContentPageFilters;
  onFilterChange: (filters: Partial<ContentPageFilters>) => void;
}) {
  const { t } = useLanguage();
  const { data: projectsData } = useProjects({ per_page: 100 });

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Project Filter */}
      <Select
        value={filters.project_id ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({ project_id: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder={t('projects.filterByProject')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('projects.allProjects')}</SelectItem>
          {projectsData?.data.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Content Type Filter */}
      <Select
        value={filters.type?.[0] ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            type: value === 'all' ? undefined : [value as ContentType],
          })
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

      {/* Status Filter */}
      <Select
        value={filters.status?.[0] ?? 'all'}
        onValueChange={(value) =>
          onFilterChange({
            status: value === 'all' ? undefined : [value as ContentStatus],
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[150px]">
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
  );
}

// Pagination component
function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLanguage();
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {t('clients.showing')
          .replace('{from}', String(from))
          .replace('{to}', String(to))
          .replace('{total}', String(total))}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}

export function ContentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ContentPageFilters>({ page: 1, per_page: 20 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useAllContentItems(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ContentPageFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle edit click - navigate to the content editor
  const handleEdit = (contentId: string) => {
    const content = data?.data.find((c) => c.id === contentId);
    if (content) {
      navigate(`/pr/projects/${content.project_id}/content/${contentId}`);
    }
  };

  // Handle delete (not implemented yet, would require project context)
  const handleDelete = (contentId: string) => {
    // For now, redirect to project to delete
    const content = data?.data.find((c) => c.id === contentId);
    if (content) {
      navigate(`/pr/projects/${content.project_id}`);
    }
  };

  // Handle content created
  const handleContentCreated = (contentId: string, projectId?: string) => {
    setCreateDialogOpen(false);
    if (projectId) {
      navigate(`/pr/projects/${projectId}/content/${contentId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('content.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('projects.contentItems')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/pr/content/new/guided')}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t('guidedContent.guidedCreate')}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('guidedContent.quickCreate')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ContentFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Content */}
      {isLoading ? (
        <ContentGridSkeleton />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{t('common.error')}</div>
      ) : data?.data.length === 0 ? (
        <EmptyContentState onCreateClick={() => setCreateDialogOpen(true)} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((content) => (
              <ContentItemCardWithProject
                key={content.id}
                content={content}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > data.per_page && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              perPage={data.per_page}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Create Content Dialog */}
      <CreateContentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleContentCreated}
      />
    </div>
  );
}

// Extended content card that shows project name
function ContentItemCardWithProject({
  content,
  onEdit,
  onDelete,
}: {
  content: ContentItemWithProject;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="relative">
      <ContentItemCard
        content={content}
        onEdit={onEdit}
        onDelete={onDelete}
        isLocked={!!content.locked_by}
        lockedByName={(content as unknown as { locked_by_user?: { name: string } }).locked_by_user?.name}
        projectName={content.project?.name}
      />
    </div>
  );
}
