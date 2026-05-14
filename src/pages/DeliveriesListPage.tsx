import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClockIcon, MailIcon, SendIcon } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { useProject } from '@/hooks/useProjects';
import { useDeliveriesForProject } from '@/hooks/useDeliveriesForProject';
import type { DeliveryStatus } from '@/types/domain';

const STATUS_LABEL: Record<DeliveryStatus, { ja: string; en: string }> = {
  draft: { ja: '下書き', en: 'Draft' },
  scheduled: { ja: '予約済', en: 'Scheduled' },
  sent: { ja: '送信済', en: 'Sent' },
  failed: { ja: '失敗', en: 'Failed' },
};

const STATUS_VARIANT: Record<
  DeliveryStatus,
  'outline' | 'default' | 'secondary' | 'destructive'
> = {
  draft: 'outline',
  scheduled: 'secondary',
  sent: 'default',
  failed: 'destructive',
};

const ATTACHMENT_LABEL: Record<string, string> = {
  pdf: 'PDF',
  word: 'Word',
  both: 'PDF + Word',
};

function formatDateTime(value: string | null, locale: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function variantsCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export default function DeliveriesListPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const { data: project } = useProject(projectId);
  const { data, isLoading, isError, refetch } =
    useDeliveriesForProject(projectId);

  if (!projectId) return <Navigate to="/projects" replace />;

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl">
            <BilingualLabel
              ja={`配信履歴: ${project?.name ?? '—'}`}
              en={`Deliveries: ${project?.name ?? '—'}`}
            />
          </h1>
          <p className="text-xs text-muted-foreground">
            <BilingualLabel
              ja="このプロジェクトから作成された配信の一覧です。"
              en="All deliveries created from this project."
            />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/audit`}>
              <BilingualLabel ja="監査に戻る" en="Back to audit" />
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/projects/${projectId}/deliver`}>
              <SendIcon className="size-4" />
              <BilingualLabel ja="新規配信" en="New delivery" />
            </Link>
          </Button>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <Alert variant="destructive">
          <AlertDescription>
            <BilingualLabel ja="読み込みに失敗しました" en="Failed to load" />
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              <BilingualLabel ja="再試行" en="Retry" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="rounded-md border border-dashed p-10 text-center space-y-3">
          <MailIcon className="mx-auto size-8 text-muted-foreground" />
          <p>
            <BilingualLabel
              ja="このプロジェクトにはまだ配信がありません。"
              en="No deliveries yet for this project."
            />
          </p>
          <Button asChild>
            <Link to={`/projects/${projectId}/deliver`}>
              <SendIcon className="size-4" />
              <BilingualLabel ja="最初の配信を作成" en="Create the first delivery" />
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <BilingualLabel ja="作成日時" en="Created" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="宛先" en="Recipient" />
              </TableHead>
              <TableHead className="text-center">
                <BilingualLabel ja="案数" en="Variants" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="添付" en="Attach." />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="状態" en="Status" />
              </TableHead>
              <TableHead>
                <BilingualLabel ja="送信日時" en="Sent at" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const status = row.status as DeliveryStatus;
              const statusLabel = STATUS_LABEL[status];
              return (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(row.created_at, i18n.language)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {row.recipient_name ?? '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.recipient_email}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {variantsCount(row.variant_ids_attached)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ATTACHMENT_LABEL[row.attachment_format] ??
                      row.attachment_format}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[status]}>
                      <BilingualLabel
                        ja={statusLabel.ja}
                        en={statusLabel.en}
                      />
                    </Badge>
                    {status === 'scheduled' && (
                      <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
                        <ClockIcon className="size-3 mr-1" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(row.sent_at, i18n.language)}
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
