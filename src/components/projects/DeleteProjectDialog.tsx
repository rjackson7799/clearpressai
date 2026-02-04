/**
 * ClearPress AI - Delete Project Dialog
 * Confirmation dialog for deleting a project
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteProject } from '@/hooks/use-projects';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
// Minimal project type needed for deletion
interface DeletableProject {
  id: string;
  name: string;
}

interface DeleteProjectDialogProps {
  project: DeletableProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const { t } = useLanguage();
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (!project) return;

    try {
      await deleteProject.mutateAsync(project.id);
      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation's onError
    }
  };

  if (!project) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('projects.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-gray-900">{project.name}</span>
            <br />
            <br />
            {t('projects.deleteConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteProject.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
