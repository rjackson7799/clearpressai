import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { useProjectSummaries } from '@/hooks/useProjects';

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

const CONTENT_TYPE_LABELS: Record<string, { ja: string; en: string }> = {
  press_release: { ja: 'プレスリリース', en: 'Press Release' },
  blog_post: { ja: 'ブログ', en: 'Blog' },
  social_media: { ja: 'SNS', en: 'Social' },
  internal_memo: { ja: '社内メモ', en: 'Memo' },
  faq: { ja: 'FAQ', en: 'FAQ' },
  executive_statement: { ja: '声明', en: 'Statement' },
};

const STATUS_LABELS: Record<string, { ja: string; en: string }> = {
  draft: { ja: '下書き', en: 'Draft' },
  in_review: { ja: 'レビュー中', en: 'In Review' },
  delivered: { ja: '送付済', en: 'Delivered' },
  feedback_received: { ja: 'フィードバック受領', en: 'Feedback' },
  completed: { ja: '完了', en: 'Completed' },
};

const URGENCY_LABELS: Record<string, { ja: string; en: string }> = {
  standard: { ja: '通常', en: 'Standard' },
  priority: { ja: '優先', en: 'Priority' },
  urgent: { ja: '緊急', en: 'Urgent' },
  crisis: { ja: '危機', en: 'Crisis' },
};

const URGENCY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> =
  {
    standard: 'secondary',
    priority: 'default',
    urgent: 'destructive',
    crisis: 'destructive',
  };

export default function ProjectsListPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useProjectSummaries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">
          <BilingualLabel ja="プロジェクト" en="Projects" />
        </h1>
        <Button asChild>
          <Link to="/projects/new">
            <BilingualLabel ja="新規プロジェクト" en="New Project" />
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p>
            <BilingualLabel ja="読み込みに失敗しました" en="Failed to load" />
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            <BilingualLabel ja="再試行" en="Retry" />
          </Button>
        </div>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="rounded-md border border-dashed p-12 text-center space-y-2">
          <p className="text-base font-medium">
            <BilingualLabel ja="プロジェクトがありません" en="No projects yet" />
          </p>
          <p className="text-sm text-muted-foreground">
            <BilingualLabel
              ja="「新規プロジェクト」から最初のブリーフを作成してください。クライアントの選択とブリーフ50字以上で生成を開始できます。"
              en="Click 'New Project' to draft your first brief. Pick a client and write 50+ characters to start generation."
            />
          </p>
          <Button asChild className="mt-2">
            <Link to="/projects/new">
              <BilingualLabel ja="新規プロジェクト" en="New Project" />
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <BilingualLabel ja="クライアント" en="Client" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="プロジェクト" en="Project" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="種別" en="Type" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="状態" en="Status" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="緊急度" en="Urgency" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="締切" en="Deadline" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="承認" en="Approved" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="最終生成" en="Last generated" />
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const contentTypeLabel = row.content_type
                ? CONTENT_TYPE_LABELS[row.content_type]
                : null;
              const statusLabel = row.status ? STATUS_LABELS[row.status] : null;
              const urgencyLabel = row.urgency
                ? URGENCY_LABELS[row.urgency]
                : null;
              return (
                <TableRow
                  key={row.id ?? `${row.client_id}-${row.name}`}
                  className="cursor-pointer"
                  onClick={() => row.id && navigate(`/projects/${row.id}/review`)}
                >
                  <TableCell className="font-medium">
                    {row.client_name ?? '—'}
                  </TableCell>
                  <TableCell>{row.name ?? '—'}</TableCell>
                  <TableCell>
                    {contentTypeLabel ? (
                      <Badge variant="secondary">
                        <BilingualLabel
                          ja={contentTypeLabel.ja}
                          en={contentTypeLabel.en}
                        />
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {statusLabel ? (
                      <Badge variant="outline">
                        <BilingualLabel
                          ja={statusLabel.ja}
                          en={statusLabel.en}
                        />
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {urgencyLabel ? (
                      <Badge
                        variant={
                          row.urgency ? URGENCY_VARIANT[row.urgency] : 'secondary'
                        }
                      >
                        <BilingualLabel
                          ja={urgencyLabel.ja}
                          en={urgencyLabel.en}
                        />
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(row.deadline, i18n.language)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.variants_approved ?? 0} / {row.variants_total ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(row.last_generated_at, i18n.language)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.id &&
                      (row.status === 'in_review' ||
                        row.status === 'delivered') && (
                        <Link
                          to={`/projects/${row.id}/deliver`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs underline-offset-2 hover:underline text-primary"
                        >
                          <BilingualLabel ja="配信 →" en="Deliver →" />
                        </Link>
                      )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
