import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FileTextIcon, PrinterIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { AuditTrailTimeline } from "@/components/audit/AuditTrailTimeline";
import { SignatureBlock } from "@/components/audit/SignatureBlock";
import { SignAuditDialog } from "@/components/audit/SignAuditDialog";
import { FindingsList } from "@/components/audit/FindingsList";
import { useProject } from "@/hooks/useProjects";
import { useClient } from "@/hooks/useClients";
import { useLatestAuditReport } from "@/hooks/useLatestAuditReport";
import { useAuditReport } from "@/hooks/useAuditReport";
import { useAuditTrailEvents } from "@/hooks/useAuditTrailEvents";
import { useCreateAuditReport } from "@/hooks/useCreateAuditReport";
import { useReportContent } from "@/hooks/useReportContent";
import type { AuditReportStatus } from "@/types/domain";

const STATUS_LABEL: Record<AuditReportStatus, { ja: string; en: string }> = {
  draft: { ja: "下書き", en: "Draft" },
  finalized: { ja: "確定済", en: "Finalized" },
  revised: { ja: "改訂済", en: "Superseded" },
};

const STATUS_VARIANT: Record<
  AuditReportStatus,
  "outline" | "default" | "secondary"
> = {
  draft: "outline",
  finalized: "default",
  revised: "secondary",
};

export default function AuditReportPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project } = useProject(projectId);
  const { data: client } = useClient(project?.client_id);
  const { data: latest, isLoading: latestLoading } =
    useLatestAuditReport(projectId);
  const { data: reportWithSigs } = useAuditReport(latest?.id);
  const { data: events } = useAuditTrailEvents(projectId);
  const create = useCreateAuditReport(projectId);

  const { content, isLoading: contentLoading, source } =
    useReportContent(latest);

  const [signOpen, setSignOpen] = useState(false);

  const status = (latest?.status ?? "draft") as AuditReportStatus;
  const canSign = latest?.status === "draft" && (content?.variants.length ?? 0) > 0;

  const handleCreate = () => {
    create.mutate(undefined, {
      onSuccess: () => toast.success("監査レポートを作成 / Audit report created"),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {client?.name ? <span>{client.name}</span> : <span>—</span>}
          </div>
          <h1 className="text-2xl">
            <BilingualLabel
              ja={`監査レポート: ${project?.name ?? "—"}`}
              en={`Audit report: ${project?.name ?? "—"}`}
            />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/review`}>
              <BilingualLabel ja="レビューに戻る" en="Back to review" />
            </Link>
          </Button>
          {latest && (latest.status === "finalized" || latest.status === "revised") && (
            <Button variant="outline" asChild>
              <Link to={`/print/audit-report/${latest.id}`} target="_blank">
                <PrinterIcon className="size-4" />
                <BilingualLabel ja="印刷" en="Print" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {latestLoading && <Skeleton className="h-32 w-full" />}

      {!latestLoading && !latest && (
        <div className="rounded-md border border-dashed p-8 text-center space-y-3">
          <FileTextIcon className="mx-auto size-8 text-muted-foreground" />
          <p>
            <BilingualLabel
              ja="このプロジェクトには監査レポートがまだありません"
              en="No audit report exists for this project yet"
            />
          </p>
          <p className="text-xs text-muted-foreground">
            <BilingualLabel
              ja="少なくとも1案を承認すると作成できます"
              en="At least one variant must be approved before assembling"
            />
          </p>
          <Button onClick={handleCreate} disabled={create.isPending}>
            <FileTextIcon className="size-4" />
            {create.isPending ? (
              <BilingualLabel ja="作成中…" en="Creating…" />
            ) : (
              <BilingualLabel ja="監査レポートを作成" en="Generate audit report" />
            )}
          </Button>
        </div>
      )}

      {latest && (
        <>
          <div className="rounded-md border bg-card p-4 flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="font-mono text-sm">{latest.report_id_display}</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge variant={STATUS_VARIANT[status]}>
                  {STATUS_LABEL[status].ja}
                  <span className="text-xs opacity-70 ml-1">
                    {STATUS_LABEL[status].en}
                  </span>
                </Badge>
                <span className="text-muted-foreground">
                  <BilingualLabel ja="バージョン" en="Version" /> {latest.version}
                </span>
                {latest.finalized_at && (
                  <span className="text-muted-foreground">
                    {new Date(latest.finalized_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {canSign && (
              <Button onClick={() => setSignOpen(true)}>
                <ShieldCheckIcon className="size-4" />
                <BilingualLabel ja="署名して確定" en="Sign & finalize" />
              </Button>
            )}
          </div>

          {source === "live" && status === "draft" && (
            <Alert>
              <AlertTitle>
                <BilingualLabel
                  ja="プレビュー: 確定前のライブビュー"
                  en="Preview: live view before finalize"
                />
              </AlertTitle>
              <AlertDescription>
                <BilingualLabel
                  ja="このページは現時点で承認されている案を表示しています。署名すると内容が固定され、その後の編集には改訂が必要です。"
                  en="This page shows currently approved variants. Signing locks the content; further edits require a revision."
                />
              </AlertDescription>
            </Alert>
          )}

          {contentLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!contentLoading && content && content.variants.length === 0 && (
            <Alert>
              <AlertTitle>
                <BilingualLabel
                  ja="承認された案がありません"
                  en="No approved variants"
                />
              </AlertTitle>
              <AlertDescription>
                <BilingualLabel
                  ja="レビュー画面で少なくとも1案を承認してください。"
                  en="Approve at least one variant on the review page."
                />
              </AlertDescription>
            </Alert>
          )}

          {!contentLoading &&
            content &&
            content.variants.map((v) => (
              <section
                key={v.id}
                className="rounded-md border bg-card p-4 space-y-3"
              >
                <header className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">案{v.variant_index}</Badge>
                    <h2 className="text-base font-medium">{v.variant_label}</h2>
                    <Badge variant="default">
                      <BilingualLabel ja="承認済" en="Approved" />
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {v.char_count}字 ·{" "}
                    <BilingualLabel
                      ja={`読了時間 約${Math.max(1, Math.round(v.reading_time_seconds / 60))}分`}
                      en={`~${Math.max(1, Math.round(v.reading_time_seconds / 60))} min`}
                    />{" "}
                    · {v.model_used}
                  </span>
                </header>

                {v.internal_approved_by && (
                  <p className="text-xs text-muted-foreground">
                    <BilingualLabel ja="承認者:" en="Approved by:" />{" "}
                    {v.internal_approved_by.name ?? v.internal_approved_by.id}
                    {v.internal_approved_at
                      ? ` · ${new Date(v.internal_approved_at).toLocaleString()}`
                      : null}
                  </p>
                )}

                <article className="whitespace-pre-wrap text-sm leading-relaxed border-l-2 border-muted pl-4">
                  {v.body_text}
                </article>

                <div className="pt-2 border-t">
                  <h3 className="text-sm font-medium mb-2">
                    <BilingualLabel
                      ja="コンプライアンス指摘"
                      en="Compliance findings"
                    />
                  </h3>
                  <FindingsList findings={v.findings} />
                </div>
              </section>
            ))}

          <section className="rounded-md border bg-card p-4 space-y-3">
            <h2 className="text-base font-medium">
              <BilingualLabel ja="署名" en="Signatures" />
            </h2>
            <SignatureBlock signatures={reportWithSigs?.signatures ?? []} />
          </section>

          <section className="rounded-md border bg-card p-4 space-y-3">
            <h2 className="text-base font-medium">
              <BilingualLabel ja="監査トレイル" en="Audit trail" />
            </h2>
            <AuditTrailTimeline events={events ?? []} />
          </section>
        </>
      )}

      <SignAuditDialog
        report={latest ?? undefined}
        open={signOpen}
        onOpenChange={setSignOpen}
        projectId={projectId}
        onSigned={() =>
          toast.success("署名を完了しました / Audit report signed")
        }
      />
    </div>
  );
}
