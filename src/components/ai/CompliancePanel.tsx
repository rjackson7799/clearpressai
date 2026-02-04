/**
 * ClearPress AI - Compliance Panel Component
 *
 * Container for compliance score, category breakdown, and issues list
 */

import { Shield, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ComplianceScoreDisplay } from './ComplianceScoreDisplay';
import { ComplianceCategoryBreakdown } from './ComplianceCategoryBreakdown';
import { IssuesList } from './IssuesList';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CheckComplianceResponse } from '@/services/ai';

interface CompliancePanelProps {
  result: CheckComplianceResponse | null;
  isChecking: boolean;
  onRecheck?: () => void;
  onAcceptSuggestion?: (issue: {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    position?: { start: number; end: number };
    suggestion?: string;
  }) => void;
  onDismissIssue?: (issue: {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
  }) => void;
  onViewInContext?: (issue: {
    position?: { start: number; end: number };
  }) => void;
}

export function CompliancePanel({
  result,
  isChecking,
  onRecheck,
  onAcceptSuggestion,
  onDismissIssue,
  onViewInContext,
}: CompliancePanelProps) {
  const { t } = useLanguage();

  // Count issues by severity
  const errorCount =
    result?.suggestions?.filter((s) => s.severity === 'error').length || 0;
  const warningCount =
    result?.suggestions?.filter((s) => s.severity === 'warning').length || 0;
  const suggestionCount =
    result?.suggestions?.filter((s) => s.severity === 'suggestion').length || 0;

  // Map suggestions to issues format
  const issues =
    result?.suggestions?.map((s) => ({
      type: s.severity,
      message: s.text,
      position: s.position,
      suggestion: undefined, // Suggestions don't have nested suggestions
    })) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-500" />
            {t('ai.complianceCheck')}
          </CardTitle>
          {onRecheck && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRecheck}
              disabled={isChecking}
              className="h-8 px-2"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Display */}
        <ComplianceScoreDisplay
          score={result?.score || 0}
          isLoading={isChecking && !result}
          errorCount={errorCount}
          warningCount={warningCount}
          suggestionCount={suggestionCount}
        />

        {/* Category Breakdown */}
        {result?.details?.categories && (
          <>
            <Separator />
            <ComplianceCategoryBreakdown categories={result.details.categories as {
              regulatory_claims: { score: number; issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[] };
              safety_info: { score: number; issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[] };
              fair_balance: { score: number; issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[] };
              substantiation: { score: number; issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[] };
              formatting: { score: number; issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[] };
            }} />
          </>
        )}

        {/* Issues List */}
        {(issues.length > 0 || (!isChecking && result)) && (
          <>
            <Separator />
            <IssuesList
              issues={issues}
              onAcceptSuggestion={onAcceptSuggestion}
              onDismissIssue={onDismissIssue}
              onViewInContext={onViewInContext}
            />
          </>
        )}

        {/* Loading State */}
        {isChecking && !result && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('ai.checking')}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isChecking && !result && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t('ai.noComplianceData')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
