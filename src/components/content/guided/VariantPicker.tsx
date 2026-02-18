/**
 * VariantPicker - Display and select from generated content variants
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
} from 'lucide-react';
import type { ContentVariant, StructuredContent } from '@/types';
import { formatTranslation } from '@/lib/translations';
import { getComplianceScoreColor } from '@/services/ai';

interface VariantPickerProps {
  variants: ContentVariant[];
  onSelectVariant: (variant: ContentVariant) => void;
  onRegenerate: () => void;
  onBackToEdit: () => void;
  isRegenerating?: boolean;
  isSelecting?: boolean;
  selectingVariantId?: string | null;
}

export function VariantPicker({
  variants,
  onSelectVariant,
  onRegenerate,
  onBackToEdit,
  isRegenerating,
  isSelecting = false,
  selectingVariantId = null,
}: VariantPickerProps) {
  const { t, language } = useLanguage();
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  const variantLabels = ['A', 'B', 'C'];

  const getToneLabel = (tone: string): string => {
    const toneMap: Record<string, string> = {
      formal: language === 'ja' ? 'フォーマル' : 'Formal',
      professional: language === 'ja' ? 'プロフェッショナル' : 'Professional',
      friendly: language === 'ja' ? 'フレンドリー' : 'Friendly',
      urgent: language === 'ja' ? '緊急' : 'Urgent',
      custom: language === 'ja' ? 'カスタム' : 'Custom',
    };
    return toneMap[tone] || tone;
  };

  const getContentPreview = (content: StructuredContent): string => {
    // Build a preview from the structured content
    const parts: string[] = [];

    if (content.headline) parts.push(content.headline);
    if (content.subheadline) parts.push(content.subheadline);
    if (content.lead) parts.push(content.lead);
    if (content.title) parts.push(content.title);
    if (content.introduction) parts.push(content.introduction);
    if (content.body && content.body.length > 0) {
      parts.push(content.body[0]);
    }
    if (content.plain_text && parts.length === 0) parts.push(content.plain_text);

    // Last resort: extract any string values from the content object
    if (parts.length === 0) {
      for (const value of Object.values(content)) {
        if (typeof value === 'string' && value.trim()) {
          parts.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && item.trim()) parts.push(item);
            else if (item && typeof item === 'object') {
              if ('text' in item) parts.push(String(item.text));
              else if ('content' in item) parts.push(String(item.content));
            }
          }
        }
      }
    }

    const fullText = parts.join('\n\n');
    return fullText.slice(0, 500) + (fullText.length > 500 ? '...' : '');
  };

  const getFullContent = (content: StructuredContent): string => {
    const parts: string[] = [];

    if (content.headline) parts.push(`【${content.headline}】`);
    if (content.subheadline) parts.push(content.subheadline);
    if (content.dateline) parts.push(content.dateline);
    if (content.lead) parts.push(content.lead);
    if (content.body) parts.push(...content.body);
    if (content.quotes) {
      content.quotes.forEach((q) => {
        parts.push(`「${q.text}」— ${q.attribution}`);
      });
    }
    if (content.title) parts.push(`【${content.title}】`);
    if (content.introduction) parts.push(content.introduction);
    if (content.sections) {
      content.sections.forEach((s) => {
        parts.push(`\n## ${s.heading}\n${s.content}`);
      });
    }
    if (content.conclusion) parts.push(content.conclusion);
    if (content.cta) parts.push(`\n${content.cta}`);
    if (content.boilerplate) parts.push(`\n---\n${content.boilerplate}`);
    if (content.isi) parts.push(`\n---\n【重要な安全性情報】\n${content.isi}`);
    if (content.contact) parts.push(`\n${content.contact}`);
    if (content.plain_text && parts.length === 0) parts.push(content.plain_text);

    // Last resort: extract any string/array values from the content object
    if (parts.length === 0) {
      for (const value of Object.values(content)) {
        if (typeof value === 'string' && value.trim()) {
          parts.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && item.trim()) parts.push(item);
            else if (item && typeof item === 'object') {
              if ('text' in item) parts.push(String(item.text));
              else if ('content' in item) parts.push(String(item.content));
            }
          }
        }
      }
    }

    return parts.join('\n\n');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('guidedContent.chooseVariant')}</h2>
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isRegenerating}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRegenerating && 'animate-spin')} />
          {t('guidedContent.regenerate')}
        </Button>
      </div>

      {/* Variant Cards */}
      <div className="space-y-4">
        {variants.map((variant, index) => {
          const isExpanded = expandedVariant === variant.id;
          const preview = getContentPreview(variant.content);
          const fullContent = getFullContent(variant.content);
          const scoreColor = getComplianceScoreColor(variant.compliance_score);

          return (
            <Card
              key={variant.id}
              className={cn(
                'transition-all',
                isExpanded && 'ring-2 ring-primary'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {variantLabels[index]}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {formatTranslation(t('guidedContent.variantLabel'), {
                          letter: variantLabels[index],
                        })}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', scoreColor)}>
                          {t('guidedContent.complianceLabel')}: {variant.compliance_score}/100
                        </span>
                        <span>
                          {t('guidedContent.wordsLabel')}: {variant.word_count}
                        </span>
                        <span>
                          {t('guidedContent.toneDetected')}: {getToneLabel(variant.generation_params.tone || 'professional')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelectVariant(variant)}
                    disabled={isSelecting}
                  >
                    {selectingVariantId === variant.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {selectingVariantId === variant.id
                      ? (t('common.loading') || '...')
                      : t('guidedContent.selectVariant')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Preview / Full Content */}
                <div className="relative">
                  <div
                    className={cn(
                      'prose prose-sm max-w-none text-muted-foreground',
                      'bg-muted/30 rounded-lg p-4',
                      isExpanded ? 'max-h-[600px] overflow-y-auto' : 'max-h-32 overflow-hidden'
                    )}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {isExpanded ? fullContent : preview}
                    </pre>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedVariant(isExpanded ? null : variant.id)}
                    className={cn(
                      'absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1',
                      'text-xs font-medium rounded-md',
                      'bg-background/90 border shadow-sm',
                      'hover:bg-accent transition-colors'
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        {t('guidedContent.collapsePreview')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        {t('guidedContent.expandPreview')}
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBackToEdit}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('guidedContent.backToEdit')}
        </Button>
      </div>
    </div>
  );
}
