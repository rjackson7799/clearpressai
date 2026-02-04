/**
 * ClearPress AI - Edit Client Dialog
 * Dialog for editing an existing client
 */

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useUpdateClient,
  useClientIndustries,
  useUpdateClientIndustries,
} from '@/hooks/use-clients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClientForm } from './ClientForm';
import type { ClientFormData } from './schemas';
import type { Client } from '@/types';

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const { t } = useLanguage();
  const updateClient = useUpdateClient();
  const updateIndustries = useUpdateClientIndustries();
  const { data: industries } = useClientIndustries(client?.id);

  // Track industry IDs for the form
  const [initialIndustryIds, setInitialIndustryIds] = useState<string[]>([]);

  // Update initial industry IDs when they're loaded
  useEffect(() => {
    if (industries) {
      setInitialIndustryIds(industries.map((i) => i.id));
    }
  }, [industries]);

  // Reset initial industry IDs when dialog closes
  useEffect(() => {
    if (!open) {
      setInitialIndustryIds([]);
    }
  }, [open]);

  const handleSubmit = async (data: ClientFormData) => {
    if (!client) return;

    try {
      // Update client details
      await updateClient.mutateAsync({
        clientId: client.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          logo_url: data.logo_url || undefined,
        },
      });

      // Update industries if changed
      const currentIds = new Set(initialIndustryIds);
      const newIds = new Set(data.industryIds);
      const hasChanged =
        currentIds.size !== newIds.size ||
        [...currentIds].some((id) => !newIds.has(id));

      if (hasChanged) {
        await updateIndustries.mutateAsync({
          clientId: client.id,
          industryIds: data.industryIds,
        });
      }

      onOpenChange(false);
    } catch {
      // Errors are handled by the mutation's onError
    }
  };

  const isSubmitting = updateClient.isPending || updateIndustries.isPending;

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('clients.editClient')}</DialogTitle>
          <DialogDescription>
            {client.name}
          </DialogDescription>
        </DialogHeader>
        <ClientForm
          defaultValues={{
            name: client.name,
            description: client.description ?? '',
            logo_url: client.logo_url ?? '',
            industryIds: initialIndustryIds,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={t('clients.updateClient')}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
