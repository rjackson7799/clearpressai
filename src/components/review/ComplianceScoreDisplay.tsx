/**
 * ClearPress AI - Compliance Score Display
 * Precision Clarity Design System
 *
 * Animated circular gauge with expandable details
 * Color-coded by score thresholds (pharmaceutical grade)
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CircularProgress, CompactCircularProgress } from '@/components/ui/circular-progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceDetails, ComplianceIssue } from '@/types';

interface ComplianceScoreDisplayProps {
  score: number | undefined;
  details?: ComplianceDetails;
  compact?: boolean;
}

// Get score label based on thresholds
function getScoreLabel(score: number, language: 'ja' | 'en'): string {
  if (score >= 90) return language === 'ja' ? '優良' : 'Excellent';
  if (score >= 70) return language === 'ja' ? '良好' : 'Good';
  if (score >= 50) return language === 'ja' ? '要確認' : 'Review Needed';
  return language === 'ja' ? '要修正' : 'Needs Work';
}

// Get badge variant based on score
function getScoreBadgeVariant(score: number): 'compliance-excellent' | 'compliance-good' | 'compliance-warning' | 'compliance-critical' {
  if (score >= 90) return 'compliance-excellent';
  if (score >= 70) return 'compliance-good';
  if (score >= 50) return 'compliance-warning';
  return 'compliance-critical';
}

// Issue icon component
function IssueIcon({ type }: { type: ComplianceIssue['type'] }) {
  const icons = {
    error: <AlertCircle className="h-4 w-4 text-[oklch(55%_0.2_28)]" />,
    warning: <AlertTriangle className="h-4 w-4 text-[oklch(72%_0.15_75)]" />,
    suggestion: <Info className="h-4 w-4 text-[oklch(58%_0.14_240)]" />,
  };
  return icons[type];
}

// Issue badge colors
function getIssueBadgeClass(type: ComplianceIssue['type']): string {
  const classes = {
    error: 'bg-[oklch(94%_0.035_28)] text-[oklch(45%_0.2_28)]',
    warning: 'bg-[oklch(95%_0.04_75)] text-[oklch(50%_0.15_75)]',
    suggestion: 'bg-[oklch(94%_0.035_240)] text-[oklch(45%_0.14_240)]',
  };
  return classes[type];
}

// Category progress bar component
function CategoryBar({
  name,
  score,
  issueCount,
}: {
  name: string;
  score: number;
  issueCount: number;
}) {
  const getBarColor = (s: number) => {
    if (s >= 90) return 'bg-[oklch(52%_0.14_155)]';
    if (s >= 70) return 'bg-[oklch(58%_0.12_155)]';
    if (s >= 50) return 'bg-[oklch(72%_0.15_75)]';
    return 'bg-[oklch(55%_0.2_28)]';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium capitalize text-muted-foreground">
          {name.replace(/_/g, ' ')}
        </span>
        <div className="flex items-center gap-2">
          {issueCount > 0 && (
            <span className="text-muted-foreground/70">
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="font-mono font-semibold tabular-nums w-8 text-right">
            {score}%
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function ComplianceScoreDisplay({
  score,
  details,
  compact = false,
}: ComplianceScoreDisplayProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Unchecked state
  if (score === undefined) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Shield className="h-4 w-4" />
        <span className="font-medium">
          {language === 'ja' ? '未チェック' : 'Not checked'}
        </span>
      </div>
    );
  }

  // Count issues by type
  const issueCount = { error: 0, warning: 0, suggestion: 0 };
  if (details?.categories) {
    Object.values(details.categories).forEach((category) => {
      category.issues?.forEach((issue) => {
        issueCount[issue.type]++;
      });
    });
  }
  const totalIssues = issueCount.error + issueCount.warning + issueCount.suggestion;

  // Compact mode - inline circular indicator
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <CompactCircularProgress value={score} size={36} />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {language === 'ja' ? 'コンプライアンス' : 'Compliance'}
          </span>
          <Badge variant={getScoreBadgeVariant(score)} size="sm">
            {getScoreLabel(score, language)}
          </Badge>
        </div>
      </div>
    );
  }

  // Full display with card
  return (
    <Card variant="elevated" className="overflow-hidden animate-fade-up">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {language === 'ja' ? 'コンプライアンススコア' : 'Compliance Score'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main score display */}
        <div className="flex items-center gap-6">
          <CircularProgress
            value={score}
            size={100}
            strokeWidth={8}
            variant="auto"
            animate
            showValue
            label="%"
          />

          <div className="flex-1 space-y-3">
            {/* Status badge */}
            <Badge variant={getScoreBadgeVariant(score)} size="lg">
              {getScoreLabel(score, language)}
            </Badge>

            {/* Issue summary icons */}
            {totalIssues > 0 && (
              <div className="flex items-center gap-4 text-sm">
                {issueCount.error > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-[oklch(55%_0.2_28)]" />
                    <span className="font-mono font-medium">{issueCount.error}</span>
                  </div>
                )}
                {issueCount.warning > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[oklch(72%_0.15_75)]" />
                    <span className="font-mono font-medium">{issueCount.warning}</span>
                  </div>
                )}
                {issueCount.suggestion > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[oklch(58%_0.14_240)]" />
                    <span className="font-mono font-medium">{issueCount.suggestion}</span>
                  </div>
                )}
              </div>
            )}

            {/* No issues message */}
            {totalIssues === 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[oklch(52%_0.14_155)]" />
                {language === 'ja' ? '問題は検出されませんでした' : 'No issues detected'}
              </p>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {details?.categories && Object.keys(details.categories).length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs uppercase tracking-wider font-medium">
                  {language === 'ja' ? '詳細を見る' : 'View Details'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-4 space-y-4 animate-fade-down">
              {/* Category breakdown */}
              <div className="space-y-4">
                {Object.entries(details.categories).map(([categoryName, category]) => {
                  const categoryIssueCount = category.issues?.length ?? 0;

                  return (
                    <div key={categoryName} className="space-y-3">
                      <CategoryBar
                        name={categoryName}
                        score={category.score}
                        issueCount={categoryIssueCount}
                      />

                      {/* Issues list */}
                      {category.issues && category.issues.length > 0 && (
                        <div className="pl-2 space-y-2">
                          {category.issues.map((issue, index) => (
                            <div
                              key={index}
                              className={cn(
                                'flex items-start gap-3 p-3 rounded-lg text-xs',
                                getIssueBadgeClass(issue.type)
                              )}
                            >
                              <IssueIcon type={issue.type} />
                              <div className="flex-1 space-y-1">
                                <p className="font-medium">{issue.message}</p>
                                {issue.suggestion && (
                                  <p className="opacity-80">
                                    {language === 'ja' ? '提案: ' : 'Suggestion: '}
                                    {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export default ComplianceScoreDisplay;
