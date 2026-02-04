/**
 * ClearPress AI - Delete Client Dialog
 * Confirmation dialog for deleting a client
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteClient } from '@/hooks/use-clients';
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
import type { Client } from '@/types';

interface DeleteClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
  const { t } = useLanguage();
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;

    try {
      await deleteClient.mutateAsync(client.id);
      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation's onError
    }
  };

  if (!client) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('clients.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-gray-900">{client.name}</span>
            <br />
            <br />
            {t('clients.deleteConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteClient.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteClient.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
