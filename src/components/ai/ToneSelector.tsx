/**
 * ClearPress AI - Tone Selector Component
 *
 * Dropdown for selecting content tone (formal, professional, friendly, urgent, custom)
 */

import { Briefcase, Building2, Smile, AlertTriangle, Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ToneType } from '@/types';

interface ToneSelectorProps {
  value: ToneType;
  onChange: (value: ToneType) => void;
  customTone?: string;
  onCustomToneChange?: (value: string) => void;
  disabled?: boolean;
}

const TONE_OPTIONS: {
  value: ToneType;
  labelKey: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    value: 'formal',
    labelKey: 'ai.toneOptions.formal',
    icon: Briefcase,
    description: '最高の丁寧さ、敬語を使用',
  },
  {
    value: 'professional',
    labelKey: 'ai.toneOptions.professional',
    icon: Building2,
    description: 'ビジネスにふさわしい表現',
  },
  {
    value: 'friendly',
    labelKey: 'ai.toneOptions.friendly',
    icon: Smile,
    description: '親しみやすく、会話的',
  },
  {
    value: 'urgent',
    labelKey: 'ai.toneOptions.urgent',
    icon: AlertTriangle,
    description: '直接的で、行動を促す',
  },
  {
    value: 'custom',
    labelKey: 'ai.toneOptions.custom',
    icon: Settings,
    description: 'カスタムトーンを指定',
  },
];

export function ToneSelector({
  value,
  onChange,
  customTone = '',
  onCustomToneChange,
  disabled = false,
}: ToneSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="tone-select">{t('ai.tone')}</Label>
        <Select value={value} onValueChange={(v) => onChange(v as ToneType)} disabled={disabled}>
          <SelectTrigger id="tone-select" className="w-full">
            <SelectValue placeholder={t('ai.selectTone')} />
          </SelectTrigger>
          <SelectContent>
            {TONE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{t(option.labelKey)}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {value === 'custom' && onCustomToneChange && (
        <div className="space-y-2">
          <Label htmlFor="custom-tone">{t('ai.customTone')}</Label>
          <Input
            id="custom-tone"
            value={customTone}
            onChange={(e) => onCustomToneChange(e.target.value)}
            placeholder={t('ai.customTonePlaceholder')}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
