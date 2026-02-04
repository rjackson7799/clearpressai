/**
 * Form sections for the guided content creation wizard
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { ContentType, ToneType, Project } from '@/types';
import {
  TARGET_AUDIENCE_OPTIONS,
  THERAPEUTIC_AREA_OPTIONS,
  DEFAULT_TARGET_LENGTHS,
} from '@/lib/content-templates';

// ===== Basic Info Section =====

interface BasicInfoSectionProps {
  projects: Project[];
  projectId: string;
  contentType: ContentType;
  title: string;
  onProjectChange: (id: string) => void;
  onContentTypeChange: (type: ContentType) => void;
  onTitleChange: (title: string) => void;
  onEnhanceTitle?: () => void;
  isEnhancing?: boolean;
}

export function BasicInfoSection({
  projects,
  projectId,
  contentType,
  title,
  onProjectChange,
  onContentTypeChange,
  onTitleChange,
  onEnhanceTitle,
  isEnhancing,
}: BasicInfoSectionProps) {
  const { t } = useLanguage();

  const contentTypes: { value: ContentType; label: string }[] = [
    { value: 'press_release', label: t('content.press_release') },
    { value: 'blog_post', label: t('content.blog_post') },
    { value: 'social_media', label: t('content.social_media') },
    { value: 'internal_memo', label: t('content.internal_memo') },
    { value: 'faq', label: t('content.faq') },
    { value: 'executive_statement', label: t('content.executive_statement') },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('guidedContent.basicInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Select */}
          <div className="space-y-2">
            <Label>{t('projects.client')}</Label>
            <Select value={projectId} onValueChange={onProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('guidedContent.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type Select */}
          <div className="space-y-2">
            <Label>{t('content.contentType')}</Label>
            <Select value={contentType} onValueChange={(v) => onContentTypeChange(v as ContentType)}>
              <SelectTrigger>
                <SelectValue placeholder={t('guidedContent.selectContentType')} />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label>{t('guidedContent.titleLabel')}</Label>
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('guidedContent.titlePlaceholder')}
              className="flex-1"
            />
            {onEnhanceTitle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEnhanceTitle}
                disabled={!title || isEnhancing}
                className="shrink-0"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {isEnhancing ? t('guidedContent.enhancing') : t('guidedContent.enhanceWithAI')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Content Brief Section =====

interface ContentBriefSectionProps {
  summary: string;
  keyMessages: string[];
  callToAction: string;
  onSummaryChange: (summary: string) => void;
  onKeyMessagesChange: (messages: string[]) => void;
  onCallToActionChange: (cta: string) => void;
}

export function ContentBriefSection({
  summary,
  keyMessages,
  callToAction,
  onSummaryChange,
  onKeyMessagesChange,
  onCallToActionChange,
}: ContentBriefSectionProps) {
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');

  const addKeyMessage = () => {
    if (newMessage.trim() && keyMessages.length < 5) {
      onKeyMessagesChange([...keyMessages, newMessage.trim()]);
      setNewMessage('');
    }
  };

  const removeKeyMessage = (index: number) => {
    onKeyMessagesChange(keyMessages.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyMessage();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('guidedContent.contentBrief')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <Label>{t('guidedContent.summaryLabel')}</Label>
          <Textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder={t('guidedContent.summaryPlaceholder')}
            rows={4}
          />
        </div>

        {/* Key Messages */}
        <div className="space-y-2">
          <Label>
            {t('guidedContent.keyMessagesLabel')}
            <span className="text-xs text-muted-foreground ml-2">
              {t('guidedContent.keyMessagesDescription')}
            </span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('guidedContent.keyMessagePlaceholder')}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addKeyMessage}
              disabled={!newMessage.trim() || keyMessages.length >= 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {keyMessages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keyMessages.map((message, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {message}
                  <button
                    type="button"
                    onClick={() => removeKeyMessage(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label>
            {t('guidedContent.ctaLabel')}
            <span className="text-xs text-muted-foreground ml-2">({t('common.optional')})</span>
          </Label>
          <Input
            value={callToAction}
            onChange={(e) => onCallToActionChange(e.target.value)}
            placeholder={t('guidedContent.ctaPlaceholder')}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Audience & Style Section =====

interface AudienceStyleSectionProps {
  targetAudience: string;
  tone: ToneType;
  customTone: string;
  keywords: string[];
  targetLength: number;
  contentType: ContentType;
  onTargetAudienceChange: (audience: string) => void;
  onToneChange: (tone: ToneType) => void;
  onCustomToneChange: (customTone: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onTargetLengthChange: (length: number) => void;
}

export function AudienceStyleSection({
  targetAudience,
  tone,
  customTone,
  keywords,
  targetLength,
  contentType,
  onTargetAudienceChange,
  onToneChange,
  onCustomToneChange,
  onKeywordsChange,
  onTargetLengthChange,
}: AudienceStyleSectionProps) {
  const { t, language } = useLanguage();
  const [newKeyword, setNewKeyword] = useState('');

  const toneOptions: { value: ToneType; label: string }[] = [
    { value: 'formal', label: t('ai.toneOptions.formal') },
    { value: 'professional', label: t('ai.toneOptions.professional') },
    { value: 'friendly', label: t('ai.toneOptions.friendly') },
    { value: 'urgent', label: t('ai.toneOptions.urgent') },
    { value: 'custom', label: t('ai.toneOptions.custom') },
  ];

  const addKeyword = () => {
    if (newKeyword.trim() && keywords.length < 10) {
      onKeywordsChange([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const defaultLength = DEFAULT_TARGET_LENGTHS[contentType] || 800;
  const maxLength = defaultLength * 2;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('guidedContent.audienceStyle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Audience */}
          <div className="space-y-2">
            <Label>{t('guidedContent.targetAudienceLabel')}</Label>
            <Select value={targetAudience} onValueChange={onTargetAudienceChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('guidedContent.selectAudience')} />
              </SelectTrigger>
              <SelectContent>
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {language === 'ja' ? option.label_ja : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label>{t('guidedContent.toneLabel')}</Label>
            <Select value={tone} onValueChange={(v) => onToneChange(v as ToneType)}>
              <SelectTrigger>
                <SelectValue placeholder={t('guidedContent.selectTone')} />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Tone (if selected) */}
        {tone === 'custom' && (
          <div className="space-y-2">
            <Label>{t('ai.customTone')}</Label>
            <Input
              value={customTone}
              onChange={(e) => onCustomToneChange(e.target.value)}
              placeholder={t('ai.customTonePlaceholder')}
            />
          </div>
        )}

        {/* Keywords */}
        <div className="space-y-2">
          <Label>{t('guidedContent.keywordsLabel')}</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('guidedContent.keywordsPlaceholder')}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addKeyword}
              disabled={!newKeyword.trim() || keywords.length >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Target Length */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>{t('guidedContent.targetLengthLabel')}</Label>
            <span className="text-sm text-muted-foreground">
              {targetLength} {t('guidedContent.words')}
            </span>
          </div>
          <Slider
            value={[targetLength]}
            onValueChange={([value]) => onTargetLengthChange(value)}
            min={100}
            max={maxLength}
            step={50}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Pharmaceutical Details Section =====

interface PharmaDetailsSectionProps {
  productName: string;
  therapeuticArea: string;
  includeIsi: boolean;
  includeBoilerplate: boolean;
  regulatoryNotes: string;
  onProductNameChange: (name: string) => void;
  onTherapeuticAreaChange: (area: string) => void;
  onIncludeIsiChange: (include: boolean) => void;
  onIncludeBoilerplateChange: (include: boolean) => void;
  onRegulatoryNotesChange: (notes: string) => void;
}

export function PharmaDetailsSection({
  productName,
  therapeuticArea,
  includeIsi,
  includeBoilerplate,
  regulatoryNotes,
  onProductNameChange,
  onTherapeuticAreaChange,
  onIncludeIsiChange,
  onIncludeBoilerplateChange,
  onRegulatoryNotesChange,
}: PharmaDetailsSectionProps) {
  const { t, language } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('guidedContent.pharmaDetails')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label>
              {t('guidedContent.productNameLabel')}
              <span className="text-xs text-muted-foreground ml-2">({t('common.optional')})</span>
            </Label>
            <Input
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
              placeholder={t('guidedContent.productNamePlaceholder')}
            />
          </div>

          {/* Therapeutic Area */}
          <div className="space-y-2">
            <Label>
              {t('guidedContent.therapeuticAreaLabel')}
              <span className="text-xs text-muted-foreground ml-2">({t('common.optional')})</span>
            </Label>
            <Select value={therapeuticArea} onValueChange={onTherapeuticAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('guidedContent.selectTherapeuticArea')} />
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

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeIsi"
              checked={includeIsi}
              onCheckedChange={(checked) => onIncludeIsiChange(checked as boolean)}
            />
            <Label htmlFor="includeIsi" className="cursor-pointer">
              {t('guidedContent.includeISI')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeBoilerplate"
              checked={includeBoilerplate}
              onCheckedChange={(checked) => onIncludeBoilerplateChange(checked as boolean)}
            />
            <Label htmlFor="includeBoilerplate" className="cursor-pointer">
              {t('guidedContent.includeBoilerplate')}
            </Label>
          </div>
        </div>

        {/* Regulatory Notes */}
        <div className="space-y-2">
          <Label>
            {t('guidedContent.regulatoryNotesLabel')}
            <span className="text-xs text-muted-foreground ml-2">({t('common.optional')})</span>
          </Label>
          <Textarea
            value={regulatoryNotes}
            onChange={(e) => onRegulatoryNotesChange(e.target.value)}
            placeholder={t('guidedContent.regulatoryNotesPlaceholder')}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
