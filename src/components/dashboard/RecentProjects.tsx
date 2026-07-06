import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import type { ProjectSummary } from '@/types/domain';

const STATUS_LABELS: Record<string, { ja: string; en: string }> = {
  draft: { ja: '下書き', en: 'Draft' },
  in_review: { ja: 'レビュー中', en: 'In Review' },
  delivered: { ja: '送付済', en: 'Delivered' },
  feedback_received: { ja: 'フィードバック受領', en: 'Feedback' },
  completed: { ja: '完了', en: 'Completed' },
};

interface Props {
  projects: ProjectSummary[];
}

export function RecentProjects({ projects }: Props) {
  const recent = projects.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualLabel ja="最近のプロジェクト" en="Recent projects" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {recent.map((row) => {
          const statusLabel = row.status ? STATUS_LABELS[row.status] : null;
          return (
            <Link
              key={row.id ?? `${row.client_id}-${row.name}`}
              to={row.id ? `/projects/${row.id}/review` : '/projects'}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
            >
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
            </Link>
          );
        })}
        <Link
          to="/projects"
          className="mt-1 inline-block px-2 text-xs text-primary underline-offset-2 hover:underline"
        >
          <BilingualLabel ja="すべて表示 →" en="View all →" />
        </Link>
      </CardContent>
    </Card>
  );
}
