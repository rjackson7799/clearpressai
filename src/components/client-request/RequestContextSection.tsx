/**
 * ClearPress AI - Request Context Section
 * Collects product info, therapeutic area, key dates, regulatory notes, and file uploads
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { THERAPEUTIC_AREA_OPTIONS } from '@/lib/client-request-templates';
import { FileUploadSection } from './FileUploadSection';
import type { UploadedFile } from '@/types/client-request';

interface RequestContextSectionProps {
  productName: string | undefined;
  therapeuticArea: string | undefined;
  keyDates: string | undefined;
  regulatoryNotes: string | undefined;
  referenceFiles: UploadedFile[];
  onProductNameChange: (name: string | undefined) => void;
  onTherapeuticAreaChange: (area: string | undefined) => void;
  onKeyDatesChange: (dates: string | undefined) => void;
  onRegulatoryNotesChange: (notes: string | undefined) => void;
  onReferenceFilesChange: (files: UploadedFile[]) => void;
}

export function RequestContextSection({
  productName,
  therapeuticArea,
  keyDates,
  regulatoryNotes,
  referenceFiles,
  onProductNameChange,
  onTherapeuticAreaChange,
  onKeyDatesChange,
  onRegulatoryNotesChange,
  onReferenceFilesChange,
}: RequestContextSectionProps) {
  const { t, language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientRequest.contextInfo')}</CardTitle>
        <CardDescription>
          {t('clientRequest.contextInfoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Name and Therapeutic Area row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product-name">
              {t('clientRequest.productName')}
              <span className="text-muted-foreground text-xs ml-2">
                ({t('common.optional')})
              </span>
            </Label>
            <Input
              id="product-name"
              value={productName || ''}
              onChange={(e) => onProductNameChange(e.target.value || undefined)}
              placeholder={t('clientRequest.productNamePlaceholder')}
            />
          </div>

          {/* Therapeutic Area */}
          <div className="space-y-2">
            <Label htmlFor="therapeutic-area">
              {t('clientRequest.therapeuticArea')}
              <span className="text-muted-foreground text-xs ml-2">
                ({t('common.optional')})
              </span>
            </Label>
            <Select
              value={therapeuticArea || ''}
              onValueChange={(v) => onTherapeuticAreaChange(v || undefined)}
            >
              <SelectTrigger id="therapeutic-area">
                <SelectValue placeholder={t('clientRequest.therapeuticAreaDescription')} />
              </SelectTrigger>
              <SelectContent>
                {THERAPEUTIC_AREA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {language === 'ja' ? option.label_ja : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Dates */}
        <div className="space-y-2">
          <Label htmlFor="key-dates">
            {t('clientRequest.keyDates')}
            <span className="text-muted-foreground text-xs ml-2">
              ({t('common.optional')})
            </span>
          </Label>
          <Textarea
            id="key-dates"
            value={keyDates || ''}
            onChange={(e) => onKeyDatesChange(e.target.value || undefined)}
            placeholder={t('clientRequest.keyDatesPlaceholder')}
            rows={2}
          />
        </div>

        {/* Regulatory Notes */}
        <div className="space-y-2">
          <Label htmlFor="regulatory-notes">
            {t('clientRequest.regulatoryNotes')}
            <span className="text-muted-foreground text-xs ml-2">
              ({t('common.optional')})
            </span>
          </Label>
          <Textarea
            id="regulatory-notes"
            value={regulatoryNotes || ''}
            onChange={(e) => onRegulatoryNotesChange(e.target.value || undefined)}
            placeholder={t('clientRequest.regulatoryNotesPlaceholder')}
            rows={2}
          />
        </div>

        {/* Reference Files */}
        <div className="space-y-2">
          <Label>{t('clientRequest.referenceFiles')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('clientRequest.referenceFilesDescription')}
          </p>
          <FileUploadSection
            files={referenceFiles}
            onFilesChange={onReferenceFilesChange}
            maxFiles={5}
          />
        </div>
      </CardContent>
    </Card>
  );
}
