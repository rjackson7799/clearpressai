/**
 * ClearPress AI - Project Info Card
 * Card displaying basic project information
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FolderKanban, Calendar, Building2, User } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import type { Project, Client, User as UserType } from '@/types';

interface ProjectInfoCardProps {
  project: Project;
  client?: Client;
  createdBy?: UserType;
}

export function ProjectInfoCard({ project, client, createdBy }: ProjectInfoCardProps) {
  const { t, language } = useLanguage();

  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-gray-400" />
          {t('projects.basicInfo')}
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-5">
        {/* Status & Urgency */}
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              {t('projects.status')}
            </p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              {t('projects.urgency')}
            </p>
            <UrgencyBadge urgency={project.urgency} />
          </div>
        </div>

        {/* Client */}
        {client && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {t('projects.client')}
            </p>
            <p className="text-sm text-gray-700 font-medium">{client.name}</p>
          </div>
        )}

        {/* Created By */}
        {createdBy && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              {t('projects.createdBy')}
            </p>
            <p className="text-sm text-gray-700">{createdBy.name}</p>
          </div>
        )}

        {/* Target Date */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t('projects.targetDate')}
          </p>
          <p className="text-sm text-gray-700">{formatDate(project.target_date)}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {t('projects.createdAt')}
            </p>
            <p className="text-sm text-gray-700">{formatDate(project.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {t('projects.updatedAt')}
            </p>
            <p className="text-sm text-gray-700">{formatDate(project.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
