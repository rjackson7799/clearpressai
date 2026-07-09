import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SegmentedControl,
  type SegmentedOption,
} from '@/components/ui/segmented-control';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { pickLang } from '@/lib/bilingual';
import { projectStatusLabel } from '@/lib/project-status';
import { relativeTime } from '@/lib/relative-time';
import type { ProjectSummary } from '@/types/domain';

type Filter = 'all' | 'in_review' | 'delivered' | 'draft';

// "delivered" is a bucket — the concept's single "Delivered" tab covers every
// post-send status. Tabs use real project statuses (there is no `in_progress`).
const DELIVERED_STATUSES = ['delivered', 'feedback_received', 'completed'];

const FILTER_OPTIONS: readonly SegmentedOption<Filter>[] = [
  { value: 'all', label: <BilingualLabel ja="すべて" en="All" /> },
  { value: 'in_review', label: <BilingualLabel ja="レビュー中" en="In review" /> },
  { value: 'delivered', label: <BilingualLabel ja="送付済" en="Delivered" /> },
  { value: 'draft', label: <BilingualLabel ja="下書き" en="Draft" /> },
];

const MAX_ROWS = 6;

function matches(filter: Filter, status: string | null): boolean {
  if (filter === 'all') return true;
  if (!status) return false;
  if (filter === 'delivered') return DELIVERED_STATUSES.includes(status);
  return status === filter;
}

function initials(name: string | null): string {
  if (!name) return '—';
  const trimmed = name.trim();
  return (trimmed.slice(0, 2) || '—').toUpperCase();
}

interface Props {
  projects: ProjectSummary[];
  now: Date;
}

export function RecentProjects({ projects, now }: Props) {
  const { i18n } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(
    () => projects.filter((p) => matches(filter, p.status)).slice(0, MAX_ROWS),
    [projects, filter],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <BilingualLabel ja="最近のプロジェクト" en="Recent projects" />
          </CardTitle>
          <SegmentedControl
            value={filter}
            onValueChange={setFilter}
            options={FILTER_OPTIONS}
            aria-label={pickLang(i18n.language, 'プロジェクトの絞り込み', 'Filter projects')}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            <BilingualLabel
              ja="該当するプロジェクトはありません"
              en="No matching projects"
            />
          </p>
        ) : (
          rows.map((row) => {
            const statusLabel = row.status
              ? projectStatusLabel(row.status)
              : null;
            const updated = relativeTime(
              row.last_generated_at ?? row.created_at,
              now,
            );
            // Links to /review to match ProjectsListPage; a zero-variant draft
            // will auto-start generation there (existing app-wide behavior).
            return (
              <Link
                key={row.id ?? `${row.client_id}-${row.name}`}
                to={row.id ? `/projects/${row.id}/review` : '/projects'}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {initials(row.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {row.name ?? '—'}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {row.client_name ?? '—'}
                  </div>
                </div>
                {statusLabel && (
                  <Badge variant="outline" className="shrink-0">
                    <BilingualLabel ja={statusLabel.ja} en={statusLabel.en} />
                  </Badge>
                )}
                <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground sm:inline">
                  {pickLang(i18n.language, updated.ja, updated.en)}
                </span>
              </Link>
            );
          })
        )}
        <Link
          to="/projects"
          className="mt-1 inline-block px-2 text-xs text-primary underline-offset-2 hover:underline"
        >
          <BilingualLabel ja="すべて表示 →" en="View all projects →" />
        </Link>
      </CardContent>
    </Card>
  );
}
