/**
 * ClearPress AI - Content Preview Component
 *
 * Shows generated content before accepting it into the editor
 */

import { Check, X, RefreshCw, Loader2, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComplianceScoreDisplay } from './ComplianceScoreDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import type { StructuredContent } from '@/types';
import { structuredToPlainText } from '@/lib/content-utils';

interface ContentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: StructuredContent | null;
  complianceScore?: number;
  wordCount?: number;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ContentPreview({
  open,
  onOpenChange,
  content,
  complianceScore = 0,
  wordCount = 0,
  onAccept,
  onReject,
  onRegenerate,
  isRegenerating = false,
}: ContentPreviewProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  // Convert structured content to plain text for display
  const plainText = content.plain_text || structuredToPlainText(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('ai.preview')}
            {wordCount > 0 && (
              <Badge variant="outline" className="ml-2 font-normal">
                {wordCount} {t('ai.characters')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{t('ai.previewDescription')}</DialogDescription>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Main Content */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="prose prose-sm max-w-none">
              {/* Headline */}
              {content.headline && (
                <h1 className="text-xl font-bold mb-2">{content.headline}</h1>
              )}

              {/* Subheadline */}
              {content.subheadline && (
                <h2 className="text-lg text-muted-foreground mb-4">
                  {content.subheadline}
                </h2>
              )}

              {/* Title (for blog/memo) */}
              {content.title && (
                <h1 className="text-xl font-bold mb-2">{content.title}</h1>
              )}

              {/* Dateline */}
              {content.dateline && (
                <p className="text-sm text-muted-foreground mb-4">{content.dateline}</p>
              )}

              {/* Lead */}
              {content.lead && <p className="font-medium mb-4">{content.lead}</p>}

              {/* Introduction */}
              {content.introduction && <p className="mb-4">{content.introduction}</p>}

              {/* Body Paragraphs */}
              {content.body?.map((paragraph, index) => (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              ))}

              {/* Sections (for blog) */}
              {content.sections?.map((section, index) => (
                <div key={index} className="mb-4">
                  <h3 className="font-semibold mb-2">{section.heading}</h3>
                  <p>{section.content}</p>
                </div>
              ))}

              {/* Quotes */}
              {content.quotes?.map((quote, index) => (
                <blockquote
                  key={index}
                  className="border-l-4 border-muted-foreground/30 pl-4 my-4 italic"
                >
                  <p>「{quote.text}」</p>
                  <footer className="text-sm text-muted-foreground mt-1">
                    — {quote.attribution}
                  </footer>
                </blockquote>
              ))}

              {/* Conclusion */}
              {content.conclusion && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">まとめ</h3>
                  <p>{content.conclusion}</p>
                </div>
              )}

              {/* CTA */}
              {content.cta && (
                <p className="font-medium text-primary mb-4">{content.cta}</p>
              )}

              {/* ISI */}
              {content.isi && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-semibold mb-2">重要な安全性情報</h4>
                  <p className="text-sm">{content.isi}</p>
                </div>
              )}

              {/* Boilerplate */}
              {content.boilerplate && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{content.boilerplate}</p>
                </div>
              )}

              {/* Contact */}
              {content.contact && (
                <div className="mt-4 text-sm">
                  <h4 className="font-semibold mb-1">お問い合わせ先</h4>
                  <p className="text-muted-foreground">{content.contact}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar with compliance */}
          <div className="w-48 flex flex-col gap-4">
            <ComplianceScoreDisplay score={complianceScore} compact={false} />

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  {t('common.copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('common.copy')}
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {/* Regenerate button on left */}
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('ai.regenerate')}
            </Button>
          )}

          {/* Accept/Reject on right */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              <X className="h-4 w-4 mr-2" />
              {t('ai.reject')}
            </Button>
            <Button
              onClick={onAccept}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('ai.accept')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

