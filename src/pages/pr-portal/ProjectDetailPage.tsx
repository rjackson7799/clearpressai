/**
 * ClearPress AI - Project Detail Page
 * Detail page for viewing and managing a single project
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProject, useUpdateProjectStatus, projectKeys } from '@/hooks/use-projects';
import { useExpandBrief } from '@/hooks/use-ai';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  LayoutDashboard,
  FileText,
  FolderOpen,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  ProjectInfoCard,
  ProjectBriefCard,
  ProjectContentSection,
  ProjectStatusBadge,
  EditProjectDialog,
  DeleteProjectDialog,
} from '@/components/projects';
import { STATUS_TRANSITIONS } from '@/components/projects/schemas';
import type { ProjectStatus } from '@/types';

// Loading skeleton
function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();

  const { data: project, isLoading, error } = useProject(id);
  const updateStatus = useUpdateProjectStatus();
  const expandBrief = useExpandBrief();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handle expand brief
  const handleExpandBrief = async () => {
    if (!project || !id || !project.client_id) return;
    try {
      await expandBrief.mutateAsync({
        project_id: project.id,
        brief: project.brief,
        client_id: project.client_id,
      });
      // Invalidate to refetch with expanded_brief
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    } catch {
      // Error handled by mutation (toast)
    }
  };

  // Get allowed status transitions
  const allowedTransitions = project
    ? STATUS_TRANSITIONS[project.status] ?? []
    : [];

  // Handle status change
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;

    try {
      await updateStatus.mutateAsync({
        projectId: project.id,
        status: newStatus,
      });
    } catch {
      // Error handled by mutation
    }
  };

  // Handle delete success - navigate back to list
  const handleDeleteSuccess = () => {
    navigate('/pr/projects');
  };

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('errors.not_found')}
        </h2>
        <p className="text-gray-500 mb-4">{t('common.error')}</p>
        <Button variant="outline" asChild>
          <Link to="/pr/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('projects.backToProjects')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/pr/projects"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('projects.backToProjects')}
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.client && (
            <p className="text-sm text-gray-500">
              {project.client.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Change Dropdown */}
          {isPRAdmin && allowedTransitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {t('projects.changeStatus')}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allowedTransitions.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status as ProjectStatus)}
                  >
                    {t(`projects.status_${status}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isPRAdmin && (
            <>
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {t('projects.tabOverview')}
          </TabsTrigger>
          <TabsTrigger value="brief" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('projects.tabBrief')}
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('projects.tabContent')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ProjectInfoCard
              project={project}
              client={project.client}
              createdBy={project.created_by_user}
            />
            <ProjectBriefCard
              project={project}
              onExpandBrief={handleExpandBrief}
              isExpanding={expandBrief.isPending}
            />
          </div>
        </TabsContent>

        {/* Brief Tab */}
        <TabsContent value="brief">
          <ProjectBriefCard
            project={project}
            onExpandBrief={handleExpandBrief}
            isExpanding={expandBrief.isPending}
          />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <ProjectContentSection projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditProjectDialog
        project={editDialogOpen ? project : null}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete Dialog */}
      <DeleteProjectDialog
        project={deleteDialogOpen ? project : null}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open && !project) {
            handleDeleteSuccess();
          }
        }}
        contentCount={project?.content_items?.length ?? 0}
      />
    </div>
  );
}
