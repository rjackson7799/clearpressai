/**
 * ClearPress AI - Urgency Badge
 * Displays project urgency level with appropriate colors
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import type { UrgencyLevel } from '@/types';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  size?: 'sm' | 'default';
}

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  standard: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  priority: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  urgent: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  crisis: 'bg-red-100 text-red-700 hover:bg-red-100',
};

export function UrgencyBadge({ urgency, size = 'default' }: UrgencyBadgeProps) {
  const { t } = useLanguage();

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : '';

  return (
    <Badge
      variant="secondary"
      className={`${URGENCY_STYLES[urgency]} ${sizeClasses} font-medium`}
    >
      {t(`urgency.${urgency}`)}
    </Badge>
  );
}
