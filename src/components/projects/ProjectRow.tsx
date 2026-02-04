/**
 * ClearPress AI - Project Row
 * Table row component for displaying project information
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2, FileText, Calendar } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
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

interface ProjectRowProps {
  project: ProjectWithRelations;
  onEdit: (project: ProjectWithRelations) => void;
  onDelete: (project: ProjectWithRelations) => void;
}

export function ProjectRow({ project, onEdit, onDelete }: ProjectRowProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isPRAdmin } = useAuth();

  // Get content items count
  const contentCount = project.content_items?.[0]?.count ?? 0;

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const handleViewDetails = () => {
    navigate(`/pr/projects/${project.id}`);
  };

  const handleRowClick = () => {
    navigate(`/pr/projects/${project.id}`);
  };

  return (
    <TableRow
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Project Name & Client */}
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{project.name}</p>
          {project.client && (
            <p className="text-sm text-gray-500 truncate">
              {project.client.name}
            </p>
          )}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <ProjectStatusBadge status={project.status} size="sm" />
      </TableCell>

      {/* Urgency */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <UrgencyBadge urgency={project.urgency} size="sm" />
      </TableCell>

      {/* Target Date */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{formatDate(project.target_date)}</span>
        </div>
      </TableCell>

      {/* Content Items Count */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-gray-600">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{contentCount}</span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('projects.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              {t('projects.viewDetails')}
            </DropdownMenuItem>
            {isPRAdmin && (
              <>
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('projects.editProject')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('projects.deleteProject')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
