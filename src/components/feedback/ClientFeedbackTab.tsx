import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  RefreshCcwIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import { supabase } from '@/lib/supabase';
import {
  useClientFeedback,
  type ClientFeedbackRow,
} from '@/hooks/useClientFeedback';
import { useRetriggerFeedbackDelta } from '@/hooks/useRetriggerFeedbackDelta';

interface Props {
  clientId: string;
}

interface GuidelineLite {
  id: string;
  source_reference_id: string | null;
  guideline_text: string;
  active: boolean;
  created_at: string;
}

// brand_voice_guidelines.source_reference_id has no FK to client_feedback.id,
// so PostgREST can't auto-embed (useClientFeedback note). This narrow
// follow-up query batches all feedback-sourced guidelines for the client and
// the component groups them client-side. Phase 7 polish: a view that
// pre-joins them per row.
function useFeedbackSourcedGuidelines(clientId: string | undefined) {
  return useQuery<Record<string, GuidelineLite[]>>({
    queryKey: ['feedback_sourced_guidelines', clientId ?? ''],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_voice_guidelines')
        .select('id, source_reference_id, guideline_text, active, created_at')
        .eq('client_id', clientId!)
        .eq('source_type', 'client_feedback')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as GuidelineLite[];
      const grouped: Record<string, GuidelineLite[]> = {};
      for (const row of rows) {
        if (!row.source_reference_id) continue;
        if (!grouped[row.source_reference_id]) {
          grouped[row.source_reference_id] = [];
        }
        grouped[row.source_reference_id].push(row);
      }
      return grouped;
    },
  });
}

function formatJp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
}

export function ClientFeedbackTab({ clientId }: Props) {
  const feedbackQ = useClientFeedback(clientId);
  const guidelinesQ = useFeedbackSourcedGuidelines(clientId);
  const retriggerM = useRetriggerFeedbackDelta(clientId);

  const handleRetry = (feedbackId: string) => {
    retriggerM.mutate(
      { feedback_id: feedbackId },
      {
        onSuccess: (result) => {
          if (result.delta_status === 'succeeded') {
            toast.success(
              'ガイドラインを再生成しました / Guidelines regenerated',
            );
          } else {
            toast.error(
              'ガイドライン抽出が再度失敗しました / Guideline extraction failed again',
            );
          }
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  if (feedbackQ.isLoading || guidelinesQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (feedbackQ.isError) {
    return (
      <div className="text-sm text-destructive">
        {(feedbackQ.error as Error).message}
      </div>
    );
  }

  const rows = feedbackQ.data ?? [];
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              <FileTextIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              <BilingualLabel
                ja="まだクライアントからのフィードバックはありません"
                en="No client feedback yet"
              />
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const guidelinesByFeedback = guidelinesQ.data ?? {};

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <FeedbackRow
          key={row.id}
          row={row}
          guidelines={guidelinesByFeedback[row.id] ?? []}
          onRetry={handleRetry}
          retryPending={
            retriggerM.isPending && retriggerM.variables?.feedback_id === row.id
          }
        />
      ))}
    </div>
  );
}

function FeedbackRow({
  row,
  guidelines,
  onRetry,
  retryPending,
}: {
  row: ClientFeedbackRow;
  guidelines: GuidelineLite[];
  onRetry: (feedbackId: string) => void;
  retryPending: boolean;
}) {
  const worked = toStringArray(row.what_worked);
  const improve = toStringArray(row.what_could_improve);
  const projectId = row.feedback_token.delivery.project.id;
  const deliveryId = row.feedback_token.delivery.id;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="truncate text-base font-medium">
              {row.feedback_token.delivery.subject}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.feedback_token.delivery.recipient_name ?? '—'} ·{' '}
              {formatJp(row.submitted_at)}
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {row.delta_generation_status === 'failed' && (
              <Badge
                variant="outline"
                className="border-destructive text-destructive"
              >
                <AlertTriangleIcon className="mr-1 size-3" />
                Delta failed
              </Badge>
            )}
            {row.delta_generation_status === 'pending' && (
              <Badge variant="outline">
                <RefreshCcwIcon className="mr-1 size-3" />
                Pending
              </Badge>
            )}
            <Link
              to={`/projects/${projectId}/deliveries`}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              title={`Open delivery ${deliveryId}`}
            >
              <ExternalLinkIcon className="size-3" />
              <BilingualLabel ja="配信を見る" en="Delivery" className="text-xs" />
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {row.needs_rework ? (
            <Badge variant="secondary" className="px-2.5">
              <BilingualLabel
                ja="再検討が必要"
                en="Needs rework"
                className="text-xs"
              />
            </Badge>
          ) : row.chosen_variant ? (
            <Badge variant="default" className="px-2.5">
              <span className="text-xs">
                案{row.chosen_variant.variant_index} ·{' '}
                {row.chosen_variant.variant_label}
              </span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <BilingualLabel ja="不明" en="Unknown" className="text-xs" />
            </Badge>
          )}
        </div>

        {(worked.length > 0 || improve.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ChipRow
              label={<BilingualLabel ja="良かった点" en="What worked" />}
              chips={worked}
            />
            <ChipRow
              label={<BilingualLabel ja="改善できる点" en="What to improve" />}
              chips={improve}
            />
          </div>
        )}

        {row.free_text_comment && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              <BilingualLabel ja="コメント" en="Comment" />
            </div>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
              {row.free_text_comment}
            </p>
          </div>
        )}

        {guidelines.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              <BilingualLabel
                ja={`生成されたガイドライン (${guidelines.length})`}
                en={`Generated guidelines (${guidelines.length})`}
              />
            </div>
            <ul className="space-y-1.5">
              {guidelines.map((g) => (
                <li
                  key={g.id}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <span>{g.guideline_text}</span>
                  {!g.active && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Archived
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : row.delta_generation_status === 'failed' ? (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  <BilingualLabel
                    ja="ガイドライン抽出に失敗しました"
                    en="Guideline extraction failed"
                  />
                </div>
                {row.delta_error && (
                  <div className="mt-0.5 break-words font-mono text-[11px]">
                    {row.delta_error}
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={retryPending}
                onClick={() => onRetry(row.id)}
                className="shrink-0"
              >
                <RefreshCcwIcon
                  className={`mr-1 size-3 ${retryPending ? 'animate-spin' : ''}`}
                />
                <BilingualLabel
                  ja="再試行"
                  en="Retry"
                  className="text-xs"
                />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChipRow({
  label,
  chips,
}: {
  label: React.ReactNode;
  chips: readonly string[];
}) {
  if (chips.length === 0) {
    return (
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">—</div>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <Badge key={c} variant="secondary" className="text-xs">
            {c}
          </Badge>
        ))}
      </div>
    </div>
  );
}
