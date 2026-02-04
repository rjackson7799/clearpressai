/**
 * TemplateSelector - Card grid for selecting content templates
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONTENT_TEMPLATES } from '@/lib/content-templates';
import type { ContentTemplate } from '@/types';
import {
  Rocket,
  FlaskConical,
  UserPlus,
  AlertTriangle,
  Shield,
  Handshake,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  FlaskConical,
  UserPlus,
  AlertTriangle,
  Shield,
  Handshake,
  FileText,
};

interface TemplateSelectorProps {
  selectedTemplate: ContentTemplate | null;
  onSelectTemplate: (template: ContentTemplate | null) => void;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('guidedContent.templatesTitle')}
        </h3>
        {selectedTemplate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTemplate(null)}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            {t('guidedContent.clearTemplate')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CONTENT_TEMPLATES.map((template) => {
          const IconComponent = ICON_MAP[template.icon] || FileText;
          const isSelected = selectedTemplate?.id === template.id;
          const name = language === 'ja' ? template.name_ja : template.name_en;
          const description =
            language === 'ja' ? template.description_ja : template.description_en;

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(isSelected ? null : template)}
              className={cn(
                'group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                'hover:border-primary/50 hover:bg-accent/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium text-center leading-tight',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {name}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTemplate && (
        <p className="text-xs text-muted-foreground">
          {t('guidedContent.templateSelected')} -{' '}
          {language === 'ja'
            ? selectedTemplate.description_ja
            : selectedTemplate.description_en}
        </p>
      )}
    </div>
  );
}
