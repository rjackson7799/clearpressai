/**
 * ContentStatusBadge - Status badge for content items
 */

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ContentStatus } from '@/types';
import {
  FileEdit,
  Send,
  Eye,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentStatusBadgeProps {
  status: ContentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const STATUS_CONFIG: Record<
  ContentStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }
> = {
  draft: {
    variant: 'secondary',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FileEdit className="h-3 w-3" />,
  },
  submitted: {
    variant: 'default',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Send className="h-3 w-3" />,
  },
  in_review: {
    variant: 'default',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Eye className="h-3 w-3" />,
  },
  needs_revision: {
    variant: 'destructive',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  approved: {
    variant: 'default',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

export function ContentStatusBadge({
  status,
  showIcon = true,
  size = 'default',
}: ContentStatusBadgeProps) {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        config.color,
        'gap-1',
        size === 'sm' && 'text-xs py-0 px-1.5'
      )}
    >
      {showIcon && config.icon}
      <span>{t(`content.status_${status}`)}</span>
    </Badge>
  );
}
