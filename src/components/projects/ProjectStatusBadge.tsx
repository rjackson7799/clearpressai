/**
 * ClearPress AI - Project Status Badge
 * Displays project status with appropriate colors
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/types';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'default';
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  requested: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  in_progress: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  in_review: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  approved: 'bg-green-100 text-green-700 hover:bg-green-100',
  completed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  archived: 'bg-slate-100 text-slate-500 hover:bg-slate-100',
};

export function ProjectStatusBadge({ status, size = 'default' }: ProjectStatusBadgeProps) {
  const { t } = useLanguage();

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : '';

  return (
    <Badge
      variant="secondary"
      className={`${STATUS_STYLES[status]} ${sizeClasses} font-medium`}
    >
      {t(`projects.status_${status}`)}
    </Badge>
  );
}
