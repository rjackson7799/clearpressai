/**
 * ClearPress AI - Compliance Category Breakdown Component
 *
 * Shows scores for each of the 5 compliance categories
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryScore {
  score: number;
  issues: { type: 'error' | 'warning' | 'suggestion'; message: string }[];
}

interface ComplianceCategoryBreakdownProps {
  categories: {
    regulatory_claims: CategoryScore;
    safety_info: CategoryScore;
    fair_balance: CategoryScore;
    substantiation: CategoryScore;
    formatting: CategoryScore;
  };
}

const CATEGORY_INFO = {
  regulatory_claims: {
    labelJa: '規制上の主張',
    labelEn: 'Regulatory Claims',
    weight: '30%',
  },
  safety_info: {
    labelJa: '安全性情報',
    labelEn: 'Safety Info',
    weight: '25%',
  },
  fair_balance: {
    labelJa: '公平なバランス',
    labelEn: 'Fair Balance',
    weight: '20%',
  },
  substantiation: {
    labelJa: '根拠',
    labelEn: 'Substantiation',
    weight: '15%',
  },
  formatting: {
    labelJa: '形式',
    labelEn: 'Formatting',
    weight: '10%',
  },
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-[var(--color-compliance-excellent)]';
  if (score >= 70) return 'bg-[var(--color-compliance-warning)]';
  return 'bg-[var(--color-compliance-critical)]';
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-[var(--color-compliance-excellent)]';
  if (score >= 70) return 'text-[var(--color-compliance-warning)]';
  return 'text-[var(--color-compliance-critical)]';
}

export function ComplianceCategoryBreakdown({ categories }: ComplianceCategoryBreakdownProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-3">
      {Object.entries(categories).map(([key, category]) => {
        const info = CATEGORY_INFO[key as keyof typeof CATEGORY_INFO];
        const issueCount = category.issues?.length || 0;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {language === 'ja' ? info.labelJa : info.labelEn}
                </span>
                <span className="text-xs text-muted-foreground">({info.weight})</span>
              </div>
              <div className="flex items-center gap-2">
                {issueCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {issueCount} {language === 'ja' ? '件' : 'issues'}
                  </span>
                )}
                <span className={cn('font-medium', getScoreTextColor(category.score))}>
                  {category.score}
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  getScoreColor(category.score)
                )}
                style={{ width: `${category.score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
