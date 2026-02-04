/**
 * ClearPress AI - Request Review Section
 * Summary view of all entered data with edit links and submit button
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, FileText, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/services/storage';
import { URGENCY_OPTIONS } from '@/lib/client-request-templates';
import type { ClientRequestWizardData, RequestWizardStep } from '@/types/client-request';
import { cn } from '@/lib/utils';

interface RequestReviewSectionProps {
  data: ClientRequestWizardData;
  onEditSection: (step: RequestWizardStep) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors?: Record<string, string>;
}

function ReviewItem({
  label,
  value,
  onEdit,
  children,
}: {
  label: string;
  value?: string | null;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-1">
          {children || (
            <span className={cn(!value && 'text-muted-foreground italic')}>
              {value || t('clientRequest.notProvided')}
            </span>
          )}
        </dd>
      </div>
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 h-8 text-xs"
          onClick={onEdit}
        >
          <Edit2 className="h-3 w-3 mr-1" />
          {t('clientRequest.editSection')}
        </Button>
      )}
    </div>
  );
}

export function RequestReviewSection({
  data,
  onEditSection,
  onSubmit,
  isSubmitting,
  errors = {},
}: RequestReviewSectionProps) {
  const { t, language } = useLanguage();

  const urgencyOption = URGENCY_OPTIONS.find((o) => o.value === data.urgency);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {t('clientRequest.reviewSubmit')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('clientRequest.reviewDescription')}
        </p>
      </div>

      {/* Validation errors */}
      {hasErrors && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <ul className="text-sm text-destructive space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Basic Info Section */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t('clientRequest.basicInfo')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onEditSection('basic')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              {t('clientRequest.editSection')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="divide-y">
            <ReviewItem label={t('clientRequest.requestName')} value={data.name} />
            <ReviewItem
              label={t('clientRequest.urgency')}
              value={
                urgencyOption
                  ? `${language === 'ja' ? urgencyOption.label_ja : urgencyOption.label_en} (${
                      language === 'ja' ? urgencyOption.timeline_ja : urgencyOption.timeline_en
                    })`
                  : undefined
              }
            />
            <ReviewItem
              label={t('clientRequest.targetDate')}
              value={data.target_date}
            />
            <ReviewItem label={t('clientRequest.contentTypeHints')}>
              {data.content_type_hints.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.content_type_hints.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {t(`clientRequest.contentTypes.${type}`)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  {t('clientRequest.notProvided')}
                </span>
              )}
            </ReviewItem>
          </dl>
        </CardContent>
      </Card>

      {/* Brief Section */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t('clientRequest.briefDetails')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onEditSection('brief')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              {t('clientRequest.editSection')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="divide-y">
            <ReviewItem label={t('clientRequest.description')}>
              <p className="text-sm whitespace-pre-wrap">
                {data.description || (
                  <span className="text-muted-foreground italic">
                    {t('clientRequest.notProvided')}
                  </span>
                )}
              </p>
            </ReviewItem>
            <ReviewItem label={t('clientRequest.objectives')}>
              {data.objectives.length > 0 ? (
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {data.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground italic">
                  {t('clientRequest.notProvided')}
                </span>
              )}
            </ReviewItem>
            <ReviewItem label={t('clientRequest.keyMessages')}>
              {data.key_messages.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.key_messages.map((msg, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {msg}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  {t('clientRequest.notProvided')}
                </span>
              )}
            </ReviewItem>
            <ReviewItem
              label={t('clientRequest.targetAudience')}
              value={
                data.target_audience
                  ? t(`clientRequest.audiences.${data.target_audience}`)
                  : undefined
              }
            />
            <ReviewItem
              label={t('clientRequest.tone')}
              value={
                data.tone === 'custom' && data.custom_tone
                  ? data.custom_tone
                  : data.tone
                  ? t(`clientRequest.tones.${data.tone}`)
                  : undefined
              }
            />
            <ReviewItem
              label={t('clientRequest.specialRequirements')}
              value={data.special_requirements}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Context Section */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t('clientRequest.contextInfo')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onEditSection('context')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              {t('clientRequest.editSection')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="divide-y">
            <ReviewItem
              label={t('clientRequest.productName')}
              value={data.product_name}
            />
            <ReviewItem
              label={t('clientRequest.therapeuticArea')}
              value={
                data.therapeutic_area
                  ? t(`clientRequest.therapeuticAreas.${data.therapeutic_area}`)
                  : undefined
              }
            />
            <ReviewItem
              label={t('clientRequest.keyDates')}
              value={data.key_dates}
            />
            <ReviewItem
              label={t('clientRequest.regulatoryNotes')}
              value={data.regulatory_notes}
            />
            <ReviewItem label={t('clientRequest.referenceFiles')}>
              {data.reference_files.length > 0 ? (
                <div className="space-y-2 mt-1">
                  {data.reference_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  {t('clientRequest.notProvided')}
                </span>
              )}
            </ReviewItem>
          </dl>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          className="w-full h-12 text-base"
          onClick={onSubmit}
          disabled={isSubmitting || hasErrors}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t('clientRequest.submitting')}
            </>
          ) : (
            t('clientRequest.submitRequest')
          )}
        </Button>
      </div>
    </div>
  );
}
