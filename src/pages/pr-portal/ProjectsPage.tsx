/**
 * ClearPress AI - Projects Page
 * Project list management for PR Portal
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Mail } from 'lucide-react';
import {
  ProjectTable,
  ProjectFilters,
  EmptyProjectState,
  CreateProjectDialog,
  EditProjectDialog,
  DeleteProjectDialog,
  EmailToProjectDialog,
} from '@/components/projects';
import type { ProjectFilters as FilterType, Client, ProjectStatus, UrgencyLevel } from '@/types';

// Extended filters including pagination
interface ProjectPageFilters extends FilterType {
  page?: number;
  per_page?: number;
}

// Extended project type with relations from the query
interface ProjectWithRelations {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  urgency: UrgencyLevel;
  target_date?: string;
  brief: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  content_items?: Array<{ count: number }>;
}

// Loading skeleton for the table
function ProjectTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const [filters, setFilters] = useState<ProjectPageFilters>({ page: 1, per_page: 20 });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithRelations | null>(null);

  const { data, isLoading, error } = useProjects(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProjectPageFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle edit click
  const handleEdit = (project: ProjectWithRelations) => {
    setEditingProject(project);
  };

  // Handle delete click
  const handleDelete = (project: ProjectWithRelations) => {
    setDeletingProject(project);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('projects.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('projects.subtitle')}</p>
        </div>
        {isPRAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              {t('projects.createFromEmail')}
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('projects.newProject')}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <ProjectFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Content */}
      {isLoading ? (
        <ProjectTableSkeleton />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{t('common.error')}</div>
      ) : data?.data.length === 0 ? (
        <EmptyProjectState
          onCreateProject={() => setCreateDialogOpen(true)}
          showCreateButton={isPRAdmin}
        />
      ) : (
        <ProjectTable
          projects={(data?.data ?? []) as ProjectWithRelations[]}
          pagination={{
            page: data?.page ?? 1,
            totalPages: data?.total_pages ?? 1,
            total: data?.total ?? 0,
            perPage: data?.per_page ?? 20,
          }}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Project Dialog */}
      <EditProjectDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      />

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        project={deletingProject}
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        contentCount={deletingProject?.content_items?.[0]?.count ?? 0}
      />

      {/* Email to Project Dialog */}
      <EmailToProjectDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </div>
  );
}
