/**
 * ClearPress AI - Project Form
 * Shared form component for creating and editing projects
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/use-clients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { projectFormSchema, type ProjectFormData } from './schemas';

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: ProjectFormProps) {
  const { t } = useLanguage();
  const { data: clientsData } = useClients({ per_page: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      client_id: '',
      brief: '',
      urgency: 'standard',
      target_date: '',
      ...defaultValues,
    },
  });

  const clientId = watch('client_id');
  const urgency = watch('urgency');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          {t('projects.projectName')}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('projects.namePlaceholder')}
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Client */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          {t('projects.client')}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Select
          value={clientId}
          onValueChange={(value) => setValue('client_id', value)}
        >
          <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
            <SelectValue placeholder={t('projects.selectClient')} />
          </SelectTrigger>
          <SelectContent>
            {clientsData?.data.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.client_id && (
          <p className="text-sm text-red-500">{errors.client_id.message}</p>
        )}
      </div>

      {/* Brief */}
      <div className="space-y-2">
        <Label htmlFor="brief" className="text-sm font-medium text-gray-700">
          {t('projects.brief')}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Textarea
          id="brief"
          placeholder={t('projects.briefPlaceholder')}
          rows={5}
          {...register('brief')}
          className={errors.brief ? 'border-red-500' : ''}
        />
        {errors.brief && (
          <p className="text-sm text-red-500">{errors.brief.message}</p>
        )}
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          {t('projects.urgency')}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Select
          value={urgency}
          onValueChange={(value) =>
            setValue('urgency', value as ProjectFormData['urgency'])
          }
        >
          <SelectTrigger className={errors.urgency ? 'border-red-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">{t('urgency.standard')}</SelectItem>
            <SelectItem value="priority">{t('urgency.priority')}</SelectItem>
            <SelectItem value="urgent">{t('urgency.urgent')}</SelectItem>
            <SelectItem value="crisis">{t('urgency.crisis')}</SelectItem>
          </SelectContent>
        </Select>
        {errors.urgency && (
          <p className="text-sm text-red-500">{errors.urgency.message}</p>
        )}
      </div>

      {/* Target Date */}
      <div className="space-y-2">
        <Label htmlFor="target_date" className="text-sm font-medium text-gray-700">
          {t('projects.targetDate')}
        </Label>
        <Input
          id="target_date"
          type="date"
          {...register('target_date')}
          className={errors.target_date ? 'border-red-500' : ''}
        />
        {errors.target_date && (
          <p className="text-sm text-red-500">{errors.target_date.message}</p>
        )}
      </div>

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
