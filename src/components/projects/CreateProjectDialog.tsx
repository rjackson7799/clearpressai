/**
 * ClearPress AI - Create Project Dialog
 * Dialog for creating a new project
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProject } from '@/hooks/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectForm } from './ProjectForm';
import type { ProjectFormData } from './schemas';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultClientId,
}: CreateProjectDialogProps) {
  const { t } = useLanguage();
  const createProject = useCreateProject();

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await createProject.mutateAsync({
        name: data.name,
        client_id: data.client_id,
        brief: data.brief,
        urgency: data.urgency,
        target_date: data.target_date || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      // Errors are handled by the mutation's onError
      console.error('Project creation failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('projects.createProject')}</DialogTitle>
          <DialogDescription>
            {t('projects.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          defaultValues={defaultClientId ? { client_id: defaultClientId } : undefined}
          onSubmit={handleSubmit}
          isSubmitting={createProject.isPending}
          submitLabel={t('projects.createProject')}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
