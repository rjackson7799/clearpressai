/**
 * ClearPress AI - Project Row
 * Table row component for displaying project information
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContentItems } from '@/hooks/use-content';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2, FileText, Calendar, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import type { Client, ProjectStatus, UrgencyLevel, ContentItem, ContentStatus, ContentType } from '@/types';

const STATUS_STYLES: Record<ContentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
};

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Lazy-load content items only when expanded
  const { data: contentItems, isLoading: isLoadingContent } = useContentItems(
    isExpanded ? project.id : undefined
  );

  // Get content items count
  const contentCount = project.content_items?.[0]?.count ?? 0;

  const getContentTypeName = (type: ContentType): string => t(`content.${type}`);
  const getStatusName = (status: ContentStatus): string => t(`content.status_${status}`);

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
    <>
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

      {/* Content Items Count - Expandable */}
      <TableCell
        onClick={(e) => {
          e.stopPropagation();
          if (contentCount > 0) setIsExpanded(!isExpanded);
        }}
        className={contentCount > 0 ? 'cursor-pointer' : ''}
      >
        <div className="flex items-center gap-1.5 text-gray-600">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{contentCount}</span>
          {contentCount > 0 && (
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
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

    {/* Expanded Content Items Row */}
    {isExpanded && (
      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
        <TableCell colSpan={6} className="py-0">
          <div className="px-4 py-3">
            {isLoadingContent ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : contentItems && contentItems.data.length > 0 ? (
              <div className="space-y-1">
                {contentItems.data.map((item: ContentItem) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pr/projects/${project.id}/content/${item.id}`);
                    }}
                    className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-white cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getContentTypeName(item.type)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        variant="secondary"
                        className={`${STATUS_STYLES[item.status]} text-xs`}
                      >
                        {getStatusName(item.status)}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                {t('projects.noContent')}
              </p>
            )}
          </div>
        </TableCell>
      </TableRow>
    )}
    </>
  );
}
