/**
 * ClearPress AI - Invite Client User Dialog
 * Dialog for inviting new client users to a specific client
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInviteUser } from '@/hooks/use-users';
import { useQueryClient } from '@tanstack/react-query';
import { clientKeys } from '@/hooks/use-clients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Zod schema for form validation
const inviteClientUserSchema = z.object({
  email: z.string().min(1, 'required').email('invalid_email'),
  name: z.string().max(100).optional(),
});

type InviteClientUserFormData = z.infer<typeof inviteClientUserSchema>;

interface InviteClientUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function InviteClientUserDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: InviteClientUserDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const inviteMutation = useInviteUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteClientUserFormData>({
    resolver: zodResolver(inviteClientUserSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const onSubmit = async (data: InviteClientUserFormData) => {
    inviteMutation.mutate(
      {
        email: data.email,
        role: 'client_user',
        name: data.name || undefined,
        client_id: clientId,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
          // Invalidate client users list
          queryClient.invalidateQueries({ queryKey: clientKeys.users(clientId) });
          queryClient.invalidateQueries({ queryKey: clientKeys.availableUsers() });
        },
      }
    );
  };

  // Handle dialog close - reset form
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      inviteMutation.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('clients.inviteClientUser')}</DialogTitle>
          <DialogDescription>
            {t('clients.inviteClientUserDescription').replace('{client}', clientName)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Email field - required */}
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t('profile.email')}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="example@company.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {errors.email.message === 'invalid_email'
                    ? t('errors.invalid_email')
                    : t('errors.required')}
                </p>
              )}
            </div>

            {/* Name field - optional */}
            <div className="space-y-2">
              <Label htmlFor="invite-name">
                {t('profile.name')}{' '}
                <span className="text-gray-400 text-sm">
                  ({t('common.optional')})
                </span>
              </Label>
              <Input
                id="invite-name"
                type="text"
                placeholder={t('clients.clientUserNamePlaceholder')}
                {...register('name')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('clients.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
