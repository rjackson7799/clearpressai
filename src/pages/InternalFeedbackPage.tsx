import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewFeedbackDialog } from "@/components/issues/NewFeedbackDialog";
import { FeedbackItemCard } from "@/components/issues/FeedbackItemCard";
import { useInternalFeedbackList } from "@/hooks/useInternalFeedback";
import {
  INTERNAL_FEEDBACK_STATUSES,
  feedbackStatusLabel,
} from "@/lib/internal-feedback";
import { pickLang } from "@/lib/bilingual";
import type { InternalFeedbackStatus } from "@/types/domain";

type Filter = "all" | InternalFeedbackStatus;

export default function InternalFeedbackPage() {
  const { i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useInternalFeedbackList();
  const [filter, setFilter] = useState<Filter>("all");

  const items = (data ?? []).filter(
    (f) => filter === "all" || f.status === filter,
  );

  return (
    <PageShell>
      <PageHeader
        title={<BilingualLabel ja="フィードバック" en="Feedback" />}
        subtitle={
          <BilingualLabel
            ja="不具合の報告・機能要望・改善のご意見を送信できます。"
            en="Report bugs, request features, and suggest improvements."
          />
        }
        actions={<NewFeedbackDialog />}
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">
            <BilingualLabel ja="すべて" en="All" />
          </TabsTrigger>
          {INTERNAL_FEEDBACK_STATUSES.map((s) => {
            const label = feedbackStatusLabel(s);
            return (
              <TabsTrigger key={s} value={s}>
                {pickLang(i18n.language, label.ja, label.en)}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
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

      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-md border border-dashed p-12 text-center space-y-2">
          <p className="text-base font-medium">
            <BilingualLabel
              ja="フィードバックはありません"
              en="No feedback yet"
            />
          </p>
          <p className="text-sm text-muted-foreground">
            <BilingualLabel
              ja="「フィードバックを送信」から不具合や要望を送ってください。"
              en="Use 'New feedback' to report a bug or request a change."
            />
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedbackItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
