/**
 * ClearPress AI - Compliance Score Display Component
 *
 * Circular score display with color coding (green/amber/red)
 */

import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getComplianceScoreColor,
  getComplianceScoreLabel,
} from '@/services/ai';

interface ComplianceScoreDisplayProps {
  score: number;
  isLoading?: boolean;
  errorCount?: number;
  warningCount?: number;
  suggestionCount?: number;
  compact?: boolean;
}

export function ComplianceScoreDisplay({
  score,
  isLoading = false,
  errorCount = 0,
  warningCount = 0,
  suggestionCount = 0,
  compact = false,
}: ComplianceScoreDisplayProps) {
  const { language } = useLanguage();
  const colorClass = getComplianceScoreColor(score);
  const label = getComplianceScoreLabel(score, language);

  // Get the appropriate shield icon
  const ShieldIcon = score >= 90 ? ShieldCheck : score >= 70 ? ShieldAlert : ShieldX;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', colorClass)}>
        <ShieldIcon className="h-4 w-4" />
        <span className="font-medium text-sm">{score}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {/* Score Circle */}
      <div className="relative">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 283} 283`}
            className={cn(
              'transition-all duration-500',
              score >= 90 ? 'text-[var(--color-compliance-excellent)]' : score >= 70 ? 'text-[var(--color-compliance-warning)]' : 'text-[var(--color-compliance-critical)]'
            )}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <Shield className="h-6 w-6 text-muted-foreground animate-pulse" />
          ) : (
            <>
              <span
                className={cn(
                  'text-2xl font-bold',
                  score >= 90
                    ? 'text-[var(--color-compliance-excellent)]'
                    : score >= 70
                      ? 'text-[var(--color-compliance-warning)]'
                      : 'text-[var(--color-compliance-critical)]'
                )}
              >
                {score}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </>
          )}
        </div>
      </div>

      {/* Status Label */}
      <div className={cn('mt-3 px-3 py-1 rounded-full text-sm font-medium', colorClass)}>
        {isLoading ? '...' : label}
      </div>

      {/* Issue Summary */}
      {!isLoading && (errorCount > 0 || warningCount > 0 || suggestionCount > 0) && (
        <div className="mt-4 flex items-center gap-4 text-xs">
          {errorCount > 0 && (
            <div className="flex items-center gap-1 text-[var(--color-error)]">
              <ShieldX className="h-3 w-3" />
              <span>{errorCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-[var(--color-warning)]">
              <ShieldAlert className="h-3 w-3" />
              <span>{warningCount}</span>
            </div>
          )}
          {suggestionCount > 0 && (
            <div className="flex items-center gap-1 text-[var(--color-info)]">
              <Shield className="h-3 w-3" />
              <span>{suggestionCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
