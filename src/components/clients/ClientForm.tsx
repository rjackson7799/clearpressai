/**
 * ClearPress AI - Client Form
 * Shared form component for creating and editing clients
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { IndustrySelector } from './IndustrySelector';
import { clientFormSchema, type ClientFormData } from './schemas';

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: ClientFormProps) {
  const { t } = useLanguage();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      description: '',
      logo_url: '',
      industryIds: [],
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Client Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          {t('clients.clientName')}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('clients.namePlaceholder')}
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          {t('clients.description')}
        </Label>
        <Textarea
          id="description"
          placeholder={t('clients.descriptionPlaceholder')}
          rows={3}
          {...register('description')}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logo_url" className="text-sm font-medium text-gray-700">
          {t('clients.logoUrl')}
        </Label>
        <Input
          id="logo_url"
          type="url"
          placeholder={t('clients.logoUrlPlaceholder')}
          {...register('logo_url')}
          className={errors.logo_url ? 'border-red-500' : ''}
        />
        {errors.logo_url && (
          <p className="text-sm text-red-500">{errors.logo_url.message}</p>
        )}
      </div>

      {/* Industries */}
      <Controller
        name="industryIds"
        control={control}
        render={({ field }) => (
          <IndustrySelector
            value={field.value}
            onChange={field.onChange}
            error={errors.industryIds?.message}
          />
        )}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel || t('common.save')}
        </Button>
      </div>
    </form>
  );
}
