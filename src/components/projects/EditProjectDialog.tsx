/**
 * ClearPress AI - Edit Project Dialog
 * Dialog for editing an existing project
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateProject } from '@/hooks/use-projects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectForm } from './ProjectForm';
import type { ProjectFormData } from './schemas';
import type { ProjectStatus, UrgencyLevel } from '@/types';

// Minimal project type needed for editing
interface EditableProject {
  id: string;
  name: string;
  client_id: string;
  brief: string;
  urgency: UrgencyLevel;
  target_date?: string;
  status: ProjectStatus;
}

interface EditProjectDialogProps {
  project: EditableProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const { t } = useLanguage();
  const updateProject = useUpdateProject();

  const handleSubmit = async (data: ProjectFormData) => {
    if (!project) return;

    try {
      await updateProject.mutateAsync({
        projectId: project.id,
        data: {
          name: data.name,
          brief: data.brief,
          urgency: data.urgency,
          target_date: data.target_date || undefined,
        },
      });

      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation's onError
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('projects.editProject')}</DialogTitle>
          <DialogDescription>{project.name}</DialogDescription>
        </DialogHeader>
        <ProjectForm
          defaultValues={{
            name: project.name,
            client_id: project.client_id,
            brief: project.brief,
            urgency: project.urgency,
            target_date: project.target_date ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateProject.isPending}
          submitLabel={t('projects.updateProject')}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
