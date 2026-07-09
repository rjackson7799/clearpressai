import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { pickLang } from '@/lib/bilingual';
import { cn } from '@/lib/utils';
import type {
  AttentionItem,
  AttentionKind,
  AttentionTone,
} from '@/lib/dashboard-metrics';

const ICON: Record<AttentionKind, LucideIcon> = {
  critical_findings: AlertTriangle,
  due_today: Clock,
  draft_audit: FileText,
};

const TONE: Record<AttentionTone, string> = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-primary/10 text-primary',
};

interface Props {
  items: AttentionItem[];
  isLoading?: boolean;
}

export function NeedsAttention({ items, isLoading }: Props) {
  const { i18n } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualLabel ja="対応が必要な項目" en="Needs your attention" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <BilingualLabel
              ja="対応が必要な項目はありません"
              en="All clear — nothing needs attention"
            />
          </div>
        ) : (
          items.map((item) => {
            const Icon = ICON[item.kind];
            return (
              <Link
                key={item.id}
                to={item.to}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    TONE[item.tone],
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {pickLang(i18n.language, item.ja, item.en)}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {pickLang(i18n.language, item.subJa, item.subEn)}
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
