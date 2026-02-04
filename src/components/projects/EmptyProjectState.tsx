/**
 * ClearPress AI - Empty Project State
 * Empty state displayed when no projects are found
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

interface EmptyProjectStateProps {
  onCreateProject: () => void;
  showCreateButton?: boolean;
}

export function EmptyProjectState({
  onCreateProject,
  showCreateButton = true,
}: EmptyProjectStateProps) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FolderKanban className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">
        {t('projects.emptyTitle')}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('projects.emptyDescription')}
      </p>
      {showCreateButton && (
        <Button onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          {t('projects.newProject')}
        </Button>
      )}
    </div>
  );
}
