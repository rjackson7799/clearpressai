/**
 * ClearPress AI - Generation Settings Panel
 *
 * Panel for configuring AI content generation settings
 * (tone, target length, ISI, boilerplate options)
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ToneSelector } from './ToneSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ToneType, ContentType } from '@/types';

interface GenerationSettingsProps {
  contentType: ContentType;
  onGenerate: (settings: GenerationSettings) => void;
  isGenerating: boolean;
  progress: number;
  disabled?: boolean;
  isPharma?: boolean;
}

export interface GenerationSettings {
  tone: ToneType;
  customTone?: string;
  targetLength: number;
  includeISI: boolean;
  includeBoilerplate: boolean;
}

const DEFAULT_LENGTH_BY_TYPE: Record<ContentType, number> = {
  press_release: 800,
  blog_post: 1200,
  social_media: 140,
  internal_memo: 400,
  faq: 600,
  executive_statement: 500,
};

export function GenerationSettingsPanel({
  contentType,
  onGenerate,
  isGenerating,
  progress,
  disabled = false,
  isPharma = false,
}: GenerationSettingsProps) {
  const { t } = useLanguage();

  const [tone, setTone] = useState<ToneType>('professional');
  const [customTone, setCustomTone] = useState('');
  const [targetLength, setTargetLength] = useState(DEFAULT_LENGTH_BY_TYPE[contentType] || 600);
  const [includeISI, setIncludeISI] = useState(isPharma);
  const [includeBoilerplate, setIncludeBoilerplate] = useState(true);

  const handleGenerate = () => {
    onGenerate({
      tone,
      customTone: tone === 'custom' ? customTone : undefined,
      targetLength,
      includeISI,
      includeBoilerplate,
    });
  };

  const isDisabled = disabled || isGenerating;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-violet-500" />
          {t('ai.generationSettings')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tone Selection */}
        <ToneSelector
          value={tone}
          onChange={setTone}
          customTone={customTone}
          onCustomToneChange={setCustomTone}
          disabled={isDisabled}
        />

        {/* Target Length */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('ai.targetLength')}</Label>
            <span className="text-sm text-muted-foreground">
              {targetLength} {t('ai.characters')}
            </span>
          </div>
          <Slider
            value={[targetLength]}
            onValueChange={(values: number[]) => setTargetLength(values[0])}
            min={100}
            max={2000}
            step={50}
            disabled={isDisabled}
            className="w-full"
          />
        </div>

        {/* ISI Checkbox (for pharmaceutical) */}
        {isPharma && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-isi"
              checked={includeISI}
              onCheckedChange={(checked) => setIncludeISI(checked === true)}
              disabled={isDisabled}
            />
            <Label htmlFor="include-isi" className="text-sm font-normal cursor-pointer">
              {t('ai.includeISI')}
            </Label>
          </div>
        )}

        {/* Boilerplate Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-boilerplate"
            checked={includeBoilerplate}
            onCheckedChange={(checked) => setIncludeBoilerplate(checked === true)}
            disabled={isDisabled}
          />
          <Label htmlFor="include-boilerplate" className="text-sm font-normal cursor-pointer">
            {t('ai.includeBoilerplate')}
          </Label>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Progress Bar */}
        {isGenerating && (
          <div className="w-full space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">{t('ai.generating')}</p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('ai.generating')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('ai.generateContent')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
