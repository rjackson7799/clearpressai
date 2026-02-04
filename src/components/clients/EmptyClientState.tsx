/**
 * ClearPress AI - Empty Client State
 * Empty state displayed when no clients are found
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

interface EmptyClientStateProps {
  onCreateClient: () => void;
  showCreateButton?: boolean;
}

export function EmptyClientState({
  onCreateClient,
  showCreateButton = true,
}: EmptyClientStateProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Building2 className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">
        {t('clients.emptyTitle')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('clients.emptyDescription')}
      </p>
      {showCreateButton && (
        <Button onClick={onCreateClient}>
          <Plus className="h-4 w-4 mr-2" />
          {t('clients.newClient')}
        </Button>
      )}
    </div>
  );
}
