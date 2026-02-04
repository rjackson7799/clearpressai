/**
 * ClearPress AI - Compliance Tooltip Component
 *
 * Hover tooltip that appears over compliance-marked text in the editor.
 * Shows issue details, suggestions, and action buttons (Accept Fix, Dismiss).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, Lightbulb, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ComplianceIssueData {
  issueId: string;
  issueType: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string | null;
  ruleReference?: string | null;
}

interface ComplianceTooltipProps {
  /** The editor container element to attach event listeners to */
  editorElement: HTMLElement | null;
  /** Callback when user accepts the suggested fix */
  onAcceptSuggestion?: (issueId: string, suggestion: string) => void;
  /** Callback when user dismisses the issue */
  onDismissIssue?: (issueId: string) => void;
}

const ISSUE_CONFIG = {
  error: {
    icon: AlertCircle,
    labelJa: 'エラー',
    labelEn: 'Error',
    badgeClass: 'bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)]/20',
    iconClass: 'text-[var(--color-error)]',
  },
  warning: {
    icon: AlertTriangle,
    labelJa: '警告',
    labelEn: 'Warning',
    badgeClass: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]/20',
    iconClass: 'text-[var(--color-warning)]',
  },
  suggestion: {
    icon: Lightbulb,
    labelJa: '提案',
    labelEn: 'Suggestion',
    badgeClass: 'bg-[var(--color-info-light)] text-[var(--color-info)] border-[var(--color-info)]/20',
    iconClass: 'text-[var(--color-info)]',
  },
};

export function ComplianceTooltip({
  editorElement,
  onAcceptSuggestion,
  onDismissIssue,
}: ComplianceTooltipProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [issue, setIssue] = useState<ComplianceIssueData | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  // Extract issue data from the marked span element
  const extractIssueData = useCallback((element: HTMLElement): ComplianceIssueData | null => {
    const issueId = element.getAttribute('data-issue-id');
    const issueType = element.getAttribute('data-issue-type') as 'error' | 'warning' | 'suggestion';
    const message = element.getAttribute('data-message');

    if (!issueId || !issueType || !message) return null;

    return {
      issueId,
      issueType,
      message,
      suggestion: element.getAttribute('data-suggestion'),
      ruleReference: element.getAttribute('data-rule-reference'),
    };
  }, []);

  // Position the tooltip near the target element
  const positionTooltip = useCallback((targetElement: HTMLElement) => {
    if (!tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position: above the element, centered horizontally
    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

    // If tooltip goes above viewport, show below
    if (top < 8) {
      top = targetRect.bottom + 8;
    }

    // Keep tooltip within horizontal bounds
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // Keep tooltip within vertical bounds
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  }, []);

  // Clear the hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Schedule hiding the tooltip
  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIssue(null);
      currentTargetRef.current = null;
    }, 150);
  }, [clearHideTimeout]);

  // Handle mouse entering a compliance mark
  const handleMarkMouseEnter = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.hasAttribute('data-compliance-issue')) return;

    clearHideTimeout();
    const issueData = extractIssueData(target);
    if (!issueData) return;

    currentTargetRef.current = target;
    setIssue(issueData);
    setIsVisible(true);

    // Position after state update
    requestAnimationFrame(() => {
      positionTooltip(target);
    });
  }, [extractIssueData, positionTooltip, clearHideTimeout]);

  // Handle mouse leaving a compliance mark
  const handleMarkMouseLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  // Handle mouse entering the tooltip itself
  const handleTooltipMouseEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  // Handle mouse leaving the tooltip
  const handleTooltipMouseLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  // Set up event listeners on the editor element
  useEffect(() => {
    if (!editorElement) return;

    // Use event delegation for efficiency
    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.hasAttribute('data-compliance-issue')) {
        handleMarkMouseEnter(event);
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement | null;

      // Don't hide if moving to another compliance mark or the tooltip
      if (
        target.hasAttribute('data-compliance-issue') &&
        (!relatedTarget ||
          (!relatedTarget.hasAttribute('data-compliance-issue') &&
            !relatedTarget.closest('[data-compliance-tooltip]')))
      ) {
        handleMarkMouseLeave();
      }
    };

    editorElement.addEventListener('mouseover', handleMouseOver);
    editorElement.addEventListener('mouseout', handleMouseOut);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver);
      editorElement.removeEventListener('mouseout', handleMouseOut);
      clearHideTimeout();
    };
  }, [editorElement, handleMarkMouseEnter, handleMarkMouseLeave, clearHideTimeout]);

  // Handle accept suggestion
  const handleAccept = useCallback(() => {
    if (issue && issue.suggestion && onAcceptSuggestion) {
      onAcceptSuggestion(issue.issueId, issue.suggestion);
      setIsVisible(false);
      setIssue(null);
    }
  }, [issue, onAcceptSuggestion]);

  // Handle dismiss issue
  const handleDismiss = useCallback(() => {
    if (issue && onDismissIssue) {
      onDismissIssue(issue.issueId);
      setIsVisible(false);
      setIssue(null);
    }
  }, [issue, onDismissIssue]);

  if (!isVisible || !issue) return null;

  const config = ISSUE_CONFIG[issue.issueType];
  const Icon = config.icon;

  return createPortal(
    <div
      ref={tooltipRef}
      data-compliance-tooltip="true"
      className={cn(
        'fixed z-[100] w-80 rounded-lg border bg-popover p-4 shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
      )}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      {/* Header with severity badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className={cn('gap-1', config.badgeClass)}>
          <Icon className={cn('h-3 w-3', config.iconClass)} />
          <span>{language === 'ja' ? config.labelJa : config.labelEn}</span>
        </Badge>
      </div>

      {/* Issue message */}
      <p className="text-sm text-foreground mb-3">{issue.message}</p>

      {/* Suggestion box */}
      {issue.suggestion && (
        <div className="bg-muted/50 border border-dashed rounded-md p-2.5 mb-3">
          <p className="text-xs text-muted-foreground mb-1">
            {language === 'ja' ? '💡 修正案:' : '💡 Suggestion:'}
          </p>
          <p className="text-sm font-medium">{issue.suggestion}</p>
        </div>
      )}

      {/* Rule reference */}
      {issue.ruleReference && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <ExternalLink className="h-3 w-3" />
          <span>{language === 'ja' ? '参照:' : 'Ref:'} {issue.ruleReference}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {issue.suggestion && onAcceptSuggestion && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs text-[var(--color-success)] border-[var(--color-success)]/30 hover:bg-[var(--color-success-light)] hover:text-[var(--color-success)]"
            onClick={handleAccept}
          >
            <Check className="h-3 w-3" />
            {language === 'ja' ? '修正を適用' : 'Accept Fix'}
          </Button>
        )}
        {onDismissIssue && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            {language === 'ja' ? '無視' : 'Dismiss'}
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ComplianceTooltip;
