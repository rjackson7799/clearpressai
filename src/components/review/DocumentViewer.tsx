/**
 * ClearPress AI - Document Viewer
 * Read-only display of content for review
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StructuredContent } from '@/types';

interface DocumentViewerProps {
  content: StructuredContent | undefined;
  isLoading?: boolean;
}

export function DocumentViewer({ content, isLoading }: DocumentViewerProps) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {language === 'ja'
              ? 'コンテンツがありません'
              : 'No content available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render structured content
  return (
    <Card>
      <CardContent className="py-6">
        <article className="prose prose-sm max-w-none dark:prose-invert">
          {/* Headline */}
          {content.headline && (
            <h1 className="text-xl font-bold mb-2 leading-tight">
              {content.headline}
            </h1>
          )}

          {/* Title (for non-press-release content) */}
          {content.title && !content.headline && (
            <h1 className="text-xl font-bold mb-2 leading-tight">
              {content.title}
            </h1>
          )}

          {/* Subheadline */}
          {content.subheadline && (
            <p className="text-lg text-muted-foreground mb-4 font-medium">
              {content.subheadline}
            </p>
          )}

          {/* Dateline */}
          {content.dateline && (
            <p className="text-sm text-muted-foreground mb-4 uppercase">
              {content.dateline}
            </p>
          )}

          {/* Lead */}
          {content.lead && (
            <p className="text-base font-medium mb-4 leading-relaxed">
              {content.lead}
            </p>
          )}

          {/* Introduction */}
          {content.introduction && (
            <p className="text-base mb-4 leading-relaxed">
              {content.introduction}
            </p>
          )}

          {/* Body paragraphs */}
          {content.body?.map((paragraph, index) => (
            <p key={index} className="text-base mb-3 leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* Sections */}
          {content.sections?.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-lg font-semibold mb-2">{section.heading}</h2>
              <p className="text-base leading-relaxed">{section.content}</p>
            </div>
          ))}

          {/* Quotes */}
          {content.quotes && content.quotes.length > 0 && (
            <div className="my-6 space-y-4">
              {content.quotes.map((quote, index) => (
                <blockquote
                  key={index}
                  className="border-l-4 border-primary/30 pl-4 italic"
                >
                  <p className="text-base mb-1">"{quote.text}"</p>
                  <footer className="text-sm text-muted-foreground">
                    — {quote.attribution}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          {/* Conclusion */}
          {content.conclusion && (
            <p className="text-base mb-4 leading-relaxed">{content.conclusion}</p>
          )}

          {/* CTA */}
          {content.cta && (
            <p className="text-base font-medium text-primary mb-4">
              {content.cta}
            </p>
          )}

          {/* ISI (Important Safety Information) */}
          {content.isi && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
                {language === 'ja' ? '重要な安全性情報' : 'Important Safety Information'}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {content.isi}
              </p>
            </div>
          )}

          {/* Boilerplate */}
          {content.boilerplate && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
                {language === 'ja' ? '会社概要' : 'About'}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {content.boilerplate}
              </p>
            </div>
          )}

          {/* Contact */}
          {content.contact && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
                {language === 'ja' ? 'お問い合わせ' : 'Contact'}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {content.contact}
              </p>
            </div>
          )}

          {/* Plain text fallback */}
          {content.plain_text && !content.body && !content.lead && (
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {content.plain_text}
            </div>
          )}

          {/* HTML fallback */}
          {content.html && !content.body && !content.lead && !content.plain_text && (
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          )}
        </article>
      </CardContent>
    </Card>
  );
}

export default DocumentViewer;
