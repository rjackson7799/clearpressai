import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { pickLang } from '@/lib/bilingual';
import type { StatTone } from '@/lib/dashboard-metrics';

export type StatAccent = 'primary' | 'emerald' | 'amber' | 'red';

const ACCENT: Record<StatAccent, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-destructive/10 text-destructive',
};

const BADGE_TONE: Record<StatTone, string> = {
  positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  default: 'bg-muted text-muted-foreground',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  critical: 'bg-destructive/10 text-destructive',
};

interface Props {
  icon: LucideIcon;
  accent: StatAccent;
  labelJa: string;
  labelEn: string;
  value: number;
  badge?: { ja: string; en: string; tone: StatTone };
  to?: string;
}

export function StatCard({
  icon: Icon,
  accent,
  labelJa,
  labelEn,
  value,
  badge,
  to,
}: Props) {
  const { i18n } = useTranslation();

  const body = (
    <Card className={cn(to && 'transition-shadow hover:ring-foreground/20')}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              ACCENT[accent],
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          {badge && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                BADGE_TONE[badge.tone],
              )}
            >
              {pickLang(i18n.language, badge.ja, badge.en)}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="text-3xl font-semibold tabular-nums">{value}</div>
          <div className="text-sm text-muted-foreground">
            {pickLang(i18n.language, labelJa, labelEn)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
