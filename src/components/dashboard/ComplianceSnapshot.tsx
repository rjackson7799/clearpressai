import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { pickLang } from '@/lib/bilingual';
import { cn } from '@/lib/utils';
import type { ComplianceSnapshot as Snapshot } from '@/lib/dashboard-metrics';

interface Props {
  snapshot: Snapshot;
  isLoading?: boolean;
}

// r chosen so the circumference is 100 → stroke-dasharray reads directly as a
// percentage. Segments are drawn clockwise from 12 o'clock (rotate -90).
const R = 15.915;

interface Segment {
  value: number;
  strokeClass: string;
  ja: string;
  en: string;
  dotClass: string;
}

export function ComplianceSnapshot({ snapshot, isLoading }: Props) {
  const { i18n } = useTranslation();
  const { variantsTotal, cleanVariants, cautionVariants, criticalVariants, cleanPct } =
    snapshot;

  const segments: Segment[] = [
    {
      value: cleanVariants,
      strokeClass: 'stroke-emerald-500',
      dotClass: 'bg-emerald-500',
      ja: '問題なし',
      en: 'No open findings',
    },
    {
      value: cautionVariants,
      strokeClass: 'stroke-amber-500',
      dotClass: 'bg-amber-500',
      ja: '警告',
      en: 'Cautions',
    },
    {
      value: criticalVariants,
      strokeClass: 'stroke-red-500',
      dotClass: 'bg-red-500',
      ja: '重大',
      en: 'Critical',
    },
  ];

  const ariaLabel = pickLang(
    i18n.language,
    `コンプライアンス: ${cleanPct ?? 0}% 問題なし、警告 ${cautionVariants} 件、重大 ${criticalVariants} 件`,
    `Compliance: ${cleanPct ?? 0}% with no open findings, ${cautionVariants} cautions, ${criticalVariants} critical`,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <BilingualLabel ja="コンプライアンス" en="Compliance" />
          </CardTitle>
          <Badge variant="outline" className="text-muted-foreground">
            <BilingualLabel ja="現在" en="Live" />
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="size-28 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : variantsTotal === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <BilingualLabel
              ja="まだコンプライアンスチェックされたコンテンツはありません。"
              en="No content has been compliance-checked yet."
            />
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative size-28 shrink-0">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r={R}
                  fill="none"
                  className="stroke-gray-200 dark:stroke-gray-800"
                  strokeWidth="3.5"
                />
                {(() => {
                  let offset = 0;
                  return segments.map((s) => {
                    const pct = (s.value / variantsTotal) * 100;
                    const el =
                      pct > 0 ? (
                        <circle
                          key={s.en}
                          cx="18"
                          cy="18"
                          r={R}
                          fill="none"
                          strokeWidth="3.5"
                          strokeLinecap="butt"
                          className={s.strokeClass}
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset}
                        />
                      ) : null;
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                role="img"
                aria-label={ariaLabel}
              >
                <span className="text-2xl font-semibold tabular-nums">
                  {cleanPct ?? '—'}
                  {cleanPct !== null && (
                    <span className="text-sm font-normal text-muted-foreground">
                      %
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <BilingualLabel ja="問題なし" en="clear" />
                </span>
              </div>
            </div>

            <ul className="flex-1 space-y-2.5">
              {segments.map((s) => (
                <li key={s.en} className="flex items-center gap-2 text-sm">
                  <span className={cn('size-2.5 shrink-0 rounded-full', s.dotClass)} />
                  <span className="flex-1 text-muted-foreground">
                    <BilingualLabel ja={s.ja} en={s.en} />
                  </span>
                  <span className="font-medium tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
