/**
 * StructuredContentEditor - Block editor for StructuredContent fields.
 *
 * Renders each field from the content type's field configuration as an
 * individually editable ContentBlock. Supports text, textarea, paragraphs,
 * quotes, and sections field types with reordering and add/remove.
 */

import { useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContentBlock } from './ContentBlock';
import { CONTENT_TYPE_FIELDS } from '@/lib/content-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StructuredContent, ContentType } from '@/types';
import type { FieldConfig } from '@/lib/content-utils';

interface StructuredContentEditorProps {
  contentType: ContentType;
  content: StructuredContent;
  onChange: (content: StructuredContent) => void;
}

export function StructuredContentEditor({
  contentType,
  content,
  onChange,
}: StructuredContentEditorProps) {
  const { language } = useLanguage();
  const fields = CONTENT_TYPE_FIELDS[contentType] || [];

  const handleFieldChange = useCallback(
    (field: FieldConfig, value: unknown) => {
      onChange({ ...content, [field.key]: value });
    },
    [content, onChange]
  );

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Content type label */}
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {language === 'ja' ? '構造化コンテンツ' : 'Structured Content'} &mdash; {contentType.replace('_', ' ')}
        </div>

        {/* Field blocks */}
        {fields.map((field) => (
          <ContentBlock
            key={field.key}
            field={field}
            value={content[field.key]}
            onChange={(value) => handleFieldChange(field, value)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
