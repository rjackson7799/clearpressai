/**
 * ClearPress AI - User Role Badge
 * Badge component showing user role with color coding
 */

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserRole } from '@/types';

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const { t } = useLanguage();

  // Only show for PR roles (pr_admin, pr_staff)
  if (role === 'client_user') return null;

  const config: Record<'pr_admin' | 'pr_staff', { label: string; className: string }> = {
    pr_admin: {
      label: t('roles.pr_admin'),
      className: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
    },
    pr_staff: {
      label: t('roles.pr_staff'),
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    },
  };

  const { label, className } = config[role];

  return <Badge className={className}>{label}</Badge>;
}
