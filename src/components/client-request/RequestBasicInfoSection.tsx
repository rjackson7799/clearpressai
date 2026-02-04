/**
 * ClearPress AI - Request Basic Info Section
 * Collects request name, urgency, target date, and content type hints
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { URGENCY_OPTIONS, CONTENT_TYPE_OPTIONS } from '@/lib/client-request-templates';
import type { ContentType, UrgencyLevel } from '@/types';
import { cn } from '@/lib/utils';

interface RequestBasicInfoSectionProps {
  name: string;
  urgency: UrgencyLevel;
  targetDate: string | undefined;
  contentTypeHints: ContentType[];
  onNameChange: (name: string) => void;
  onUrgencyChange: (urgency: UrgencyLevel) => void;
  onTargetDateChange: (date: string | undefined) => void;
  onContentTypeHintsChange: (types: ContentType[]) => void;
  errors?: Record<string, string>;
}

export function RequestBasicInfoSection({
  name,
  urgency,
  targetDate,
  contentTypeHints,
  onNameChange,
  onUrgencyChange,
  onTargetDateChange,
  onContentTypeHintsChange,
  errors = {},
}: RequestBasicInfoSectionProps) {
  const { t, language } = useLanguage();

  const handleContentTypeToggle = (type: ContentType) => {
    if (contentTypeHints.includes(type)) {
      onContentTypeHintsChange(contentTypeHints.filter((t) => t !== type));
    } else {
      onContentTypeHintsChange([...contentTypeHints, type]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientRequest.basicInfo')}</CardTitle>
        <CardDescription>
          {t('clientRequest.basicInfoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Request Name */}
        <div className="space-y-2">
          <Label htmlFor="request-name">
            {t('clientRequest.requestName')}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="request-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('clientRequest.requestNamePlaceholder')}
            className={cn(errors.name && 'border-destructive')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Urgency and Target Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">{t('clientRequest.urgency')}</Label>
            <Select value={urgency} onValueChange={(v) => onUrgencyChange(v as UrgencyLevel)}>
              <SelectTrigger id="urgency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{language === 'ja' ? option.label_ja : option.label_en}</span>
                      <span className="text-xs text-muted-foreground">
                        {language === 'ja' ? option.timeline_ja : option.timeline_en}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('clientRequest.urgencyDescription')}
            </p>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target-date">
              {t('clientRequest.targetDate')}
              <span className="text-muted-foreground text-xs ml-2">
                ({t('common.optional')})
              </span>
            </Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate || ''}
              onChange={(e) => onTargetDateChange(e.target.value || undefined)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              {t('clientRequest.targetDateDescription')}
            </p>
          </div>
        </div>

        {/* Content Type Hints */}
        <div className="space-y-3">
          <Label>{t('clientRequest.contentTypeHints')}</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            {t('clientRequest.contentTypeHintsDescription')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                  contentTypeHints.includes(option.value as ContentType)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
                onClick={() => handleContentTypeToggle(option.value as ContentType)}
              >
                <Checkbox
                  id={`content-type-${option.value}`}
                  checked={contentTypeHints.includes(option.value as ContentType)}
                  onCheckedChange={() => handleContentTypeToggle(option.value as ContentType)}
                />
                <Label
                  htmlFor={`content-type-${option.value}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {language === 'ja' ? option.label_ja : option.label_en}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
