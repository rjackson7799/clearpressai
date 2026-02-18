/**
 * ContentBlock - Individual field renderer for the Structured Content Editor.
 *
 * Five variants based on FieldConfig.type:
 * - text:       single-line Input
 * - textarea:   multi-line Textarea
 * - paragraphs: ordered list of Textarea (body[])
 * - quotes:     list of quote cards (text + attribution)
 * - sections:   list of section cards (heading + content)
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FieldConfig } from '@/lib/content-utils';

interface ContentBlockProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function ContentBlock({ field, value, onChange }: ContentBlockProps) {
  const { t, language } = useLanguage();
  const label = language === 'ja' ? field.labelJa : field.labelEn;

  switch (field.type) {
    case 'text':
      return (
        <TextBlock
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
        />
      );
    case 'textarea':
      return (
        <TextareaBlock
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
        />
      );
    case 'paragraphs':
      return (
        <ParagraphsBlock
          label={label}
          items={(value as string[]) || []}
          onChange={onChange}
          addLabel={t('editor.addParagraph')}
          itemLabel={t('editor.paragraph')}
        />
      );
    case 'quotes':
      return (
        <QuotesBlock
          label={label}
          items={(value as { text: string; attribution: string }[]) || []}
          onChange={onChange}
          addLabel={t('editor.addQuote')}
          textLabel={t('editor.quoteText')}
          attributionLabel={t('editor.quoteAttribution')}
        />
      );
    case 'sections':
      return (
        <SectionsBlock
          label={label}
          items={(value as { heading: string; content: string }[]) || []}
          onChange={onChange}
          addLabel={t('editor.addSection')}
          headingLabel={t('editor.sectionHeading')}
          contentLabel={t('editor.sectionContent')}
        />
      );
    default:
      return null;
  }
}

// ===== Simple field variants =====

function TextBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background"
      />
    </div>
  );
}

function TextareaBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="bg-background resize-y"
      />
    </div>
  );
}

// ===== Array item controls =====

function ArrayItemControls({
  index,
  length,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  index: number;
  length: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onMoveUp}
        disabled={index === 0}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onMoveDown}
        disabled={index === length - 1}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ===== Array field variants =====

function ParagraphsBlock({
  label,
  items,
  onChange,
  addLabel,
  itemLabel,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  addLabel: string;
  itemLabel: string;
}) {
  const swap = (i: number, j: number) => {
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">{itemLabel} {i + 1}</span>
            <Textarea
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              rows={3}
              className="bg-background resize-y"
            />
          </div>
          <ArrayItemControls
            index={i}
            length={items.length}
            onMoveUp={() => swap(i, i - 1)}
            onMoveDown={() => swap(i, i + 1)}
            onDelete={() => onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, ''])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

function QuotesBlock({
  label,
  items,
  onChange,
  addLabel,
  textLabel,
  attributionLabel,
}: {
  label: string;
  items: { text: string; attribution: string }[];
  onChange: (v: { text: string; attribution: string }[]) => void;
  addLabel: string;
  textLabel: string;
  attributionLabel: string;
}) {
  const swap = (i: number, j: number) => {
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label} {i + 1}</span>
            <ArrayItemControls
              index={i}
              length={items.length}
              onMoveUp={() => swap(i, i - 1)}
              onMoveDown={() => swap(i, i + 1)}
              onDelete={() => onChange(items.filter((_, j) => j !== i))}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{textLabel}</span>
            <Textarea
              value={item.text}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], text: e.target.value };
                onChange(next);
              }}
              rows={2}
              className="bg-background resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{attributionLabel}</span>
            <Input
              value={item.attribution}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], attribution: e.target.value };
                onChange(next);
              }}
              className="bg-background"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, { text: '', attribution: '' }])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

function SectionsBlock({
  label,
  items,
  onChange,
  addLabel,
  headingLabel,
  contentLabel,
}: {
  label: string;
  items: { heading: string; content: string }[];
  onChange: (v: { heading: string; content: string }[]) => void;
  addLabel: string;
  headingLabel: string;
  contentLabel: string;
}) {
  const swap = (i: number, j: number) => {
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label} {i + 1}</span>
            <ArrayItemControls
              index={i}
              length={items.length}
              onMoveUp={() => swap(i, i - 1)}
              onMoveDown={() => swap(i, i + 1)}
              onDelete={() => onChange(items.filter((_, j) => j !== i))}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{headingLabel}</span>
            <Input
              value={item.heading}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], heading: e.target.value };
                onChange(next);
              }}
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{contentLabel}</span>
            <Textarea
              value={item.content}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], content: e.target.value };
                onChange(next);
              }}
              rows={3}
              className="bg-background resize-y"
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, { heading: '', content: '' }])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}
