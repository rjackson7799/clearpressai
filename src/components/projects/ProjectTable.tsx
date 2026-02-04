/**
 * ClearPress AI - Project Table
 * Table component for displaying project list with pagination
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { formatTranslation } from '@/lib/translations';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectRow } from './ProjectRow';
import type { Client, ProjectStatus, UrgencyLevel } from '@/types';

// Extended project type with relations from the query
// Note: We don't extend Project because the query returns content_items as { count }[] not ContentItem[]
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

interface ProjectTableProps {
  projects: ProjectWithRelations[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (project: ProjectWithRelations) => void;
  onDelete: (project: ProjectWithRelations) => void;
}

export function ProjectTable({
  projects,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  const { t } = useLanguage();

  // Calculate showing range
  const from = (pagination.page - 1) * pagination.perPage + 1;
  const to = Math.min(pagination.page * pagination.perPage, pagination.total);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.projectName')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.status')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.urgency')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.targetDate')}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.content')}
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('projects.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {formatTranslation(t('projects.showing'), {
              from,
              to,
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
