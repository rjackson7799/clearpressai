/**
 * ClearPress AI - User Status Badge
 * Badge component showing user active/inactive status
 */

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserStatusBadgeProps {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  const { t } = useLanguage();

  if (isActive) {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        {t('profile.active')}
      </Badge>
    );
  }

  return (
    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
      {t('profile.inactive')}
    </Badge>
  );
}
