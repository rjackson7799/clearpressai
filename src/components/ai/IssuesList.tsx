/**
 * ClearPress AI - Issues List Component
 *
 * Displays compliance issues grouped by severity with accept/dismiss actions
 */

import { AlertCircle, AlertTriangle, Lightbulb, Check, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface ComplianceIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
  rule_reference?: string;
}

interface IssuesListProps {
  issues: ComplianceIssue[];
  onAcceptSuggestion?: (issue: ComplianceIssue) => void;
  onDismissIssue?: (issue: ComplianceIssue) => void;
  onViewInContext?: (issue: ComplianceIssue) => void;
}

const ISSUE_CONFIG = {
  error: {
    icon: AlertCircle,
    labelJa: 'エラー',
    labelEn: 'Errors',
    bgColor: 'bg-[var(--color-error-light)]',
    borderColor: 'border-[var(--color-error)]/20',
    iconColor: 'text-[var(--color-error)]',
    badgeVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    labelJa: '警告',
    labelEn: 'Warnings',
    bgColor: 'bg-[var(--color-warning-light)]',
    borderColor: 'border-[var(--color-warning)]/20',
    iconColor: 'text-[var(--color-warning)]',
    badgeVariant: 'outline' as const,
  },
  suggestion: {
    icon: Lightbulb,
    labelJa: '提案',
    labelEn: 'Suggestions',
    bgColor: 'bg-[var(--color-info-light)]',
    borderColor: 'border-[var(--color-info)]/20',
    iconColor: 'text-[var(--color-info)]',
    badgeVariant: 'secondary' as const,
  },
};

function IssueItem({
  issue,
  onAccept,
  onDismiss,
  onViewInContext,
}: {
  issue: ComplianceIssue;
  onAccept?: () => void;
  onDismiss?: () => void;
  onViewInContext?: () => void;
}) {
  const { t } = useLanguage();
  const config = ISSUE_CONFIG[issue.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Message */}
          <p className="text-sm">{issue.message}</p>

          {/* Rule Reference */}
          {issue.rule_reference && (
            <p className="text-xs text-muted-foreground">
              参照: {issue.rule_reference}
            </p>
          )}

          {/* Suggestion */}
          {issue.suggestion && (
            <div className="text-xs bg-white/50 p-2 rounded border border-dashed">
              <span className="font-medium">{t('ai.suggestion')}: </span>
              {issue.suggestion}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {issue.suggestion && onAccept && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-[var(--color-success)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-light)]"
                onClick={onAccept}
              >
                <Check className="h-3 w-3 mr-1" />
                {t('ai.acceptSuggestion')}
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="h-3 w-3 mr-1" />
                {t('ai.dismissSuggestion')}
              </Button>
            )}
            {issue.position && onViewInContext && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-[var(--color-info)] hover:text-[var(--color-info)] hover:bg-[var(--color-info-light)] ml-auto"
                onClick={onViewInContext}
              >
                {t('ai.viewInContext')}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function IssuesList({
  issues,
  onAcceptSuggestion,
  onDismissIssue,
  onViewInContext,
}: IssuesListProps) {
  const { language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['error', 'warning'])
  );

  // Group issues by type
  const groupedIssues = {
    error: issues.filter((i) => i.type === 'error'),
    warning: issues.filter((i) => i.type === 'warning'),
    suggestion: issues.filter((i) => i.type === 'suggestion'),
  };

  const toggleSection = (type: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lightbulb className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p className="text-sm">
          {language === 'ja'
            ? '問題は見つかりませんでした'
            : 'No issues found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(['error', 'warning', 'suggestion'] as const).map((type) => {
        const typeIssues = groupedIssues[type];
        if (typeIssues.length === 0) return null;

        const config = ISSUE_CONFIG[type];
        const Icon = config.icon;
        const isExpanded = expandedSections.has(type);

        return (
          <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleSection(type)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', config.iconColor)} />
                <span className="font-medium text-sm">
                  {language === 'ja' ? config.labelJa : config.labelEn}
                </span>
                <Badge variant={config.badgeVariant} className="h-5 px-1.5">
                  {typeIssues.length}
                </Badge>
              </div>
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {typeIssues.map((issue, index) => (
                <IssueItem
                  key={`${type}-${index}`}
                  issue={issue}
                  onAccept={
                    issue.suggestion && onAcceptSuggestion
                      ? () => onAcceptSuggestion(issue)
                      : undefined
                  }
                  onDismiss={onDismissIssue ? () => onDismissIssue(issue) : undefined}
                  onViewInContext={
                    issue.position && onViewInContext
                      ? () => onViewInContext(issue)
                      : undefined
                  }
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
