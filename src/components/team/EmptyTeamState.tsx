/**
 * ClearPress AI - Empty Team State
 * Empty state displayed when no team members are found
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

interface EmptyTeamStateProps {
  onInvite: () => void;
}

export function EmptyTeamState({ onInvite }: EmptyTeamStateProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Users className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">
        {t('team.emptyTitle')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('team.emptyDescription')}
      </p>
      <Button onClick={onInvite}>
        <UserPlus className="h-4 w-4 mr-2" />
        {t('team.inviteUser')}
      </Button>
    </div>
  );
}
