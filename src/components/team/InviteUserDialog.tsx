/**
 * ClearPress AI - Invite User Dialog
 * Dialog for inviting new team members via email
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInviteUser } from '@/hooks/use-users';
import { InviteError } from '@/services/users';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';

// Zod schema for form validation
const inviteUserSchema = z.object({
  email: z.string().min(1, 'required').email('invalid_email'),
  name: z.string().max(100).optional(),
  role: z.enum(['pr_admin', 'pr_staff']),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { t } = useLanguage();
  const inviteMutation = useInviteUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'pr_staff',
    },
  });

  const selectedRole = watch('role');

  // Get user-friendly error message for inline display
  const getErrorMessage = (): string | null => {
    if (!inviteMutation.error) return null;
    const error = inviteMutation.error;
    if (error instanceof InviteError) {
      switch (error.code) {
        case 'ALREADY_MEMBER': return t('team.errors.alreadyMember');
        case 'ALREADY_INVITED': return t('team.errors.alreadyInvited');
        case 'RATE_LIMITED': return t('team.errors.rateLimited');
        case 'EMAIL_DELIVERY_FAILED': return t('team.errors.emailDeliveryFailed');
        case 'NETWORK_ERROR': return t('team.errors.networkError');
        default: return t('team.errors.inviteFailed');
      }
    }
    return t('team.errors.inviteFailed');
  };

  const onSubmit = async (data: InviteUserFormData) => {
    inviteMutation.mutate(
      {
        email: data.email,
        role: data.role,
        name: data.name || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
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
          <DialogTitle>{t('team.inviteUser')}</DialogTitle>
          <DialogDescription>{t('team.inviteDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Email field - required */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
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
              <Label htmlFor="name">
                {t('profile.name')}{' '}
                <span className="text-gray-400 text-sm">
                  ({t('common.optional')})
                </span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder={t('team.namePlaceholder')}
                {...register('name')}
              />
            </div>

            {/* Role select - required */}
            <div className="space-y-2">
              <Label htmlFor="role">{t('profile.role')}</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setValue('role', value as 'pr_admin' | 'pr_staff')
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pr_staff">{t('roles.pr_staff')}</SelectItem>
                  <SelectItem value="pr_admin">{t('roles.pr_admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {getErrorMessage() && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{getErrorMessage()}</span>
            </div>
          )}

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
              {t('team.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
