/**
 * ClearPress AI - Request Brief Section
 * Collects detailed brief information: description, objectives, key messages, audience, tone
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { TARGET_AUDIENCE_OPTIONS, TONE_OPTIONS } from '@/lib/client-request-templates';
import type { ToneType } from '@/types';
import { cn } from '@/lib/utils';

interface RequestBriefSectionProps {
  description: string;
  objectives: string[];
  keyMessages: string[];
  targetAudience: string;
  tone: ToneType;
  customTone: string | undefined;
  specialRequirements: string | undefined;
  onDescriptionChange: (description: string) => void;
  onObjectivesChange: (objectives: string[]) => void;
  onKeyMessagesChange: (keyMessages: string[]) => void;
  onTargetAudienceChange: (audience: string) => void;
  onToneChange: (tone: ToneType) => void;
  onCustomToneChange: (customTone: string | undefined) => void;
  onSpecialRequirementsChange: (requirements: string | undefined) => void;
  errors?: Record<string, string>;
}

export function RequestBriefSection({
  description,
  objectives,
  keyMessages,
  targetAudience,
  tone,
  customTone,
  specialRequirements,
  onDescriptionChange,
  onObjectivesChange,
  onKeyMessagesChange,
  onTargetAudienceChange,
  onToneChange,
  onCustomToneChange,
  onSpecialRequirementsChange,
  errors = {},
}: RequestBriefSectionProps) {
  const { t, language } = useLanguage();
  const [newObjective, setNewObjective] = useState('');
  const [newKeyMessage, setNewKeyMessage] = useState('');

  const handleAddObjective = () => {
    if (newObjective.trim() && objectives.length < 5) {
      onObjectivesChange([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    onObjectivesChange(objectives.filter((_, i) => i !== index));
  };

  const handleAddKeyMessage = () => {
    if (newKeyMessage.trim() && keyMessages.length < 5) {
      onKeyMessagesChange([...keyMessages, newKeyMessage.trim()]);
      setNewKeyMessage('');
    }
  };

  const handleRemoveKeyMessage = (index: number) => {
    onKeyMessagesChange(keyMessages.filter((_, i) => i !== index));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    type: 'objective' | 'keyMessage'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'objective') {
        handleAddObjective();
      } else {
        handleAddKeyMessage();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientRequest.briefDetails')}</CardTitle>
        <CardDescription>
          {t('clientRequest.briefDetailsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {t('clientRequest.description')}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t('clientRequest.descriptionPlaceholder')}
            rows={5}
            className={cn(errors.description && 'border-destructive')}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Objectives */}
        <div className="space-y-2">
          <Label>{t('clientRequest.objectives')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('clientRequest.objectivesDescription')}
          </p>
          <div className="flex gap-2">
            <Input
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'objective')}
              placeholder={t('clientRequest.objectivesPlaceholder')}
              disabled={objectives.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddObjective}
              disabled={!newObjective.trim() || objectives.length >= 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {objectives.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {objectives.map((objective, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {objective}
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Key Messages */}
        <div className="space-y-2">
          <Label>{t('clientRequest.keyMessages')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('clientRequest.keyMessagesDescription')}
          </p>
          <div className="flex gap-2">
            <Input
              value={newKeyMessage}
              onChange={(e) => setNewKeyMessage(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'keyMessage')}
              placeholder={t('clientRequest.keyMessagesPlaceholder')}
              disabled={keyMessages.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddKeyMessage}
              disabled={!newKeyMessage.trim() || keyMessages.length >= 5}
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
                    onClick={() => handleRemoveKeyMessage(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Target Audience and Tone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="target-audience">
              {t('clientRequest.targetAudience')}
            </Label>
            <Select value={targetAudience} onValueChange={onTargetAudienceChange}>
              <SelectTrigger id="target-audience">
                <SelectValue placeholder={t('clientRequest.targetAudienceDescription')} />
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
            <Label htmlFor="tone">{t('clientRequest.tone')}</Label>
            <Select
              value={tone}
              onValueChange={(v) => {
                onToneChange(v as ToneType);
                if (v !== 'custom') {
                  onCustomToneChange(undefined);
                }
              }}
            >
              <SelectTrigger id="tone">
                <SelectValue placeholder={t('clientRequest.toneDescription')} />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {language === 'ja' ? option.label_ja : option.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Tone (conditional) */}
        {tone === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-tone">{t('clientRequest.customTone')}</Label>
            <Input
              id="custom-tone"
              value={customTone || ''}
              onChange={(e) => onCustomToneChange(e.target.value || undefined)}
              placeholder={t('clientRequest.customTonePlaceholder')}
            />
          </div>
        )}

        {/* Special Requirements */}
        <div className="space-y-2">
          <Label htmlFor="special-requirements">
            {t('clientRequest.specialRequirements')}
            <span className="text-muted-foreground text-xs ml-2">
              ({t('common.optional')})
            </span>
          </Label>
          <Textarea
            id="special-requirements"
            value={specialRequirements || ''}
            onChange={(e) => onSpecialRequirementsChange(e.target.value || undefined)}
            placeholder={t('clientRequest.specialRequirementsPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
