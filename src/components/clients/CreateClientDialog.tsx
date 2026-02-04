/**
 * ClearPress AI - Create Client Dialog
 * Dialog for creating a new client
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateClient, useUpdateClientIndustries } from '@/hooks/use-clients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClientForm } from './ClientForm';
import type { ClientFormData } from './schemas';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const { t } = useLanguage();
  const createClient = useCreateClient();
  const updateIndustries = useUpdateClientIndustries();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      // Create the client first
      const newClient = await createClient.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        logo_url: data.logo_url || undefined,
      });

      // Then update industries if any selected
      if (data.industryIds.length > 0) {
        await updateIndustries.mutateAsync({
          clientId: newClient.id,
          industryIds: data.industryIds,
        });
      }

      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation's onError
    }
  };

  const isSubmitting = createClient.isPending || updateIndustries.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('clients.createClient')}</DialogTitle>
          <DialogDescription>
            {t('clients.emptyDescription')}
          </DialogDescription>
        </DialogHeader>
        <ClientForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={t('clients.createClient')}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
