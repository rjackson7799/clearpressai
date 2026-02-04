/**
 * ClearPress AI - Request Template Selector
 * Card grid for selecting request templates
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  FlaskConical,
  Building2,
  AlertTriangle,
  Calendar,
  Lightbulb,
  Check,
  X,
  FileEdit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLIENT_REQUEST_TEMPLATES } from '@/lib/client-request-templates';
import type { ClientRequestTemplate } from '@/types/client-request';

interface RequestTemplateSelectorProps {
  selectedTemplate: ClientRequestTemplate | null;
  onSelectTemplate: (template: ClientRequestTemplate | null) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  FlaskConical,
  Building2,
  AlertTriangle,
  Calendar,
  Lightbulb,
};

export function RequestTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: RequestTemplateSelectorProps) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {t('clientRequest.templatesTitle')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('clientRequest.templatesDescription')}
        </p>
      </div>

      {/* Selected template indicator */}
      {selectedTemplate && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {t('clientRequest.templateSelected')}:{' '}
            {language === 'ja'
              ? selectedTemplate.name_ja
              : selectedTemplate.name_en}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 ml-2 text-xs"
            onClick={() => onSelectTemplate(null)}
          >
            <X className="h-3 w-3 mr-1" />
            {t('clientRequest.clearTemplate')}
          </Button>
        </div>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLIENT_REQUEST_TEMPLATES.map((template) => {
          const IconComponent = ICON_MAP[template.icon] || FileEdit;
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              )}
              onClick={() => onSelectTemplate(isSelected ? null : template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">
                      {language === 'ja'
                        ? template.name_ja
                        : template.name_en}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {language === 'ja'
                        ? template.description_ja
                        : template.description_en}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Template defaults preview */}
                {template.defaults.content_type_hints && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.defaults.content_type_hints.slice(0, 2).map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t(`clientRequest.contentTypes.${type}`)}
                      </Badge>
                    ))}
                    {template.defaults.urgency && (
                      <Badge
                        variant={
                          template.defaults.urgency === 'crisis'
                            ? 'destructive'
                            : template.defaults.urgency === 'urgent'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t(`projects.urgency.${template.defaults.urgency}`)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Skip option */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => onSelectTemplate(null)}
          className="text-muted-foreground"
        >
          <FileEdit className="h-4 w-4 mr-2" />
          {t('clientRequest.skipTemplate')}
        </Button>
      </div>
    </div>
  );
}
