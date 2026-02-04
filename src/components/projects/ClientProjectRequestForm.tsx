/**
 * ClearPress AI - Client Project Request Form
 * Simplified form for clients to submit PR work requests
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { clientRequestFormSchema, type ClientRequestFormData } from './schemas';

interface ClientProjectRequestFormProps {
  onSubmit: (data: ClientRequestFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

// Content type labels
const CONTENT_TYPE_LABELS: Record<string, { ja: string; en: string }> = {
  press_release: { ja: 'プレスリリース', en: 'Press Release' },
  blog_post: { ja: 'ブログ記事', en: 'Blog Post' },
  social_media: { ja: 'ソーシャルメディア', en: 'Social Media' },
  internal_memo: { ja: '社内文書', en: 'Internal Memo' },
  faq: { ja: 'FAQ', en: 'FAQ' },
  executive_statement: { ja: '経営者声明', en: 'Executive Statement' },
};

// Urgency labels
const URGENCY_LABELS: Record<string, { ja: string; en: string; description: { ja: string; en: string } }> = {
  standard: {
    ja: '通常',
    en: 'Standard',
    description: { ja: '5-7営業日', en: '5-7 business days' },
  },
  priority: {
    ja: '優先',
    en: 'Priority',
    description: { ja: '2-3営業日', en: '2-3 business days' },
  },
  urgent: {
    ja: '緊急',
    en: 'Urgent',
    description: { ja: '24-48時間', en: '24-48 hours' },
  },
  crisis: {
    ja: '危機対応',
    en: 'Crisis',
    description: { ja: '当日対応', en: 'Same day' },
  },
};

export function ClientProjectRequestForm({
  onSubmit,
  isSubmitting = false,
  onCancel,
}: ClientProjectRequestFormProps) {
  const { language, t } = useLanguage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientRequestFormData>({
    resolver: zodResolver(clientRequestFormSchema),
    defaultValues: {
      name: '',
      brief: '',
      urgency: 'standard',
      target_date: '',
      content_type_hint: undefined,
    },
  });

  const urgency = watch('urgency');
  const contentTypeHint = watch('content_type_hint');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Request Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          {language === 'ja' ? 'リクエスト名' : 'Request Name'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          placeholder={
            language === 'ja'
              ? '例: 新製品発表プレスリリース'
              : 'e.g., New Product Launch Press Release'
          }
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Content Type Hint (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {language === 'ja' ? '希望するコンテンツタイプ' : 'Preferred Content Type'}
          <span className="text-muted-foreground ml-1 text-xs">
            ({language === 'ja' ? 'オプション' : 'Optional'})
          </span>
        </Label>
        <Select
          value={contentTypeHint ?? ''}
          onValueChange={(value) =>
            setValue(
              'content_type_hint',
              value as ClientRequestFormData['content_type_hint']
            )
          }
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                language === 'ja' ? '選択してください' : 'Select type'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, labels]) => (
              <SelectItem key={value} value={value}>
                {labels[language]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brief / Description */}
      <div className="space-y-2">
        <Label htmlFor="brief" className="text-sm font-medium">
          {language === 'ja' ? '依頼内容' : 'Request Details'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Textarea
          id="brief"
          placeholder={
            language === 'ja'
              ? '依頼の背景、目的、伝えたいメッセージ、ターゲット読者などを記載してください。'
              : 'Describe the background, purpose, key messages, and target audience.'
          }
          rows={6}
          {...register('brief')}
          className={errors.brief ? 'border-destructive' : ''}
        />
        {errors.brief && (
          <p className="text-sm text-destructive">{errors.brief.message}</p>
        )}
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {language === 'ja' ? '緊急度' : 'Urgency'}
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={urgency}
          onValueChange={(value) =>
            setValue('urgency', value as ClientRequestFormData['urgency'])
          }
        >
          <SelectTrigger className={errors.urgency ? 'border-destructive' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(URGENCY_LABELS).map(([value, labels]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <span>{labels[language]}</span>
                  <span className="text-muted-foreground text-xs">
                    ({labels.description[language]})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.urgency && (
          <p className="text-sm text-destructive">{errors.urgency.message}</p>
        )}
      </div>

      {/* Target Date */}
      <div className="space-y-2">
        <Label htmlFor="target_date" className="text-sm font-medium">
          {language === 'ja' ? '希望納期' : 'Preferred Deadline'}
          <span className="text-muted-foreground ml-1 text-xs">
            ({language === 'ja' ? 'オプション' : 'Optional'})
          </span>
        </Label>
        <Input
          id="target_date"
          type="date"
          {...register('target_date')}
          className={errors.target_date ? 'border-destructive' : ''}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors.target_date && (
          <p className="text-sm text-destructive">{errors.target_date.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {language === 'ja' ? 'リクエストを送信' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
