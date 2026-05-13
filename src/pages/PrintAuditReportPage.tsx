import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { AuditTrailTimeline } from "@/components/audit/AuditTrailTimeline";
import { SignatureBlock } from "@/components/audit/SignatureBlock";
import { FindingsList } from "@/components/audit/FindingsList";
import { useAuditReport } from "@/hooks/useAuditReport";
import { useAuditTrailEvents } from "@/hooks/useAuditTrailEvents";
import { useProject } from "@/hooks/useProjects";
import { useClient } from "@/hooks/useClients";
import type { AuditReportSnapshot } from "@/types/audit-snapshot";

// I2: print artifact ALWAYS reads from report_snapshot. Drafts can't be
// printed -- the immutable record is what gets handed off. Rendered
// outside AppShell so the sidebar/header don't bleed into the PDF.
//
// Print styles inline: @page margins, page-break-inside for sections,
// color preservation so severity badges keep their hue.
export default function PrintAuditReportPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const { data: report } = useAuditReport(reportId);
  const { data: project } = useProject(report?.project_id);
  const { data: client } = useClient(project?.client_id);
  const { data: events } = useAuditTrailEvents(report?.project_id);

  // Auto-trigger the print dialog once the snapshot loads. Users can
  // dismiss and re-print via Ctrl+P.
  useEffect(() => {
    if (!report) return;
    if (report.status !== "finalized" && report.status !== "revised") return;
    const t = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(t);
  }, [report]);

  if (!report) {
    return (
      <div className="p-8">
        <p>
          <BilingualLabel ja="読み込み中…" en="Loading…" />
        </p>
      </div>
    );
  }

  if (report.status !== "finalized" && report.status !== "revised") {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertTitle>
            <BilingualLabel
              ja="印刷できません"
              en="Cannot print"
            />
          </AlertTitle>
          <AlertDescription>
            <BilingualLabel
              ja="このレポートはまだ確定されていません。署名後に印刷できます。"
              en="This report is not yet finalized. Sign it first to enable printing."
            />
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to={`/projects/${report.project_id}/audit`}>
            <BilingualLabel ja="監査ページに戻る" en="Back to audit page" />
          </Link>
        </Button>
      </div>
    );
  }

  const snapshot = report.report_snapshot as AuditReportSnapshot | null;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="print-doc bg-background text-foreground p-10 max-w-3xl mx-auto space-y-6">
        <div className="no-print flex items-center justify-between gap-2 pb-4 border-b">
          <Button variant="outline" asChild size="sm">
            <Link to={`/projects/${report.project_id}/audit`}>
              <BilingualLabel ja="戻る" en="Back" />
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <BilingualLabel ja="印刷" en="Print" />
          </Button>
        </div>

        <header className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            <BilingualLabel ja="監査レポート" en="Audit Report" />
          </p>
          <h1 className="text-2xl font-medium">
            {project?.name ?? report.project_id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? null}
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs pt-2">
            <dt className="text-muted-foreground">
              <BilingualLabel ja="レポートID" en="Report ID" />
            </dt>
            <dd className="font-mono">{report.report_id_display}</dd>
            <dt className="text-muted-foreground">
              <BilingualLabel ja="バージョン" en="Version" />
            </dt>
            <dd>{report.version}</dd>
            <dt className="text-muted-foreground">
              <BilingualLabel ja="ステータス" en="Status" />
            </dt>
            <dd>{report.status}</dd>
            {report.finalized_at && (
              <>
                <dt className="text-muted-foreground">
                  <BilingualLabel ja="確定日時" en="Finalized at" />
                </dt>
                <dd>{new Date(report.finalized_at).toLocaleString()}</dd>
              </>
            )}
          </dl>
        </header>

        {snapshot &&
          snapshot.variants.map((v) => (
            <section
              key={v.id}
              className="print-section space-y-3 border-t pt-4"
            >
              <header className="space-y-1">
                <h2 className="text-base font-medium">
                  案{v.variant_index} · {v.variant_label}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {v.char_count}字 ·{" "}
                  <BilingualLabel
                    ja={`読了時間 約${Math.max(1, Math.round(v.reading_time_seconds / 60))}分`}
                    en={`~${Math.max(1, Math.round(v.reading_time_seconds / 60))} min`}
                  />{" "}
                  · {v.model_used}
                </p>
                {v.internal_approved_by && (
                  <p className="text-xs text-muted-foreground">
                    <BilingualLabel ja="承認者:" en="Approved by:" />{" "}
                    {v.internal_approved_by.name ?? v.internal_approved_by.id}
                    {v.internal_approved_at
                      ? ` · ${new Date(v.internal_approved_at).toLocaleString()}`
                      : null}
                  </p>
                )}
              </header>
              <article className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
                {v.body_text}
              </article>
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  <BilingualLabel
                    ja="コンプライアンス指摘"
                    en="Compliance findings"
                  />
                </h3>
                <FindingsList findings={v.findings} />
              </div>
            </section>
          ))}

        <section className="print-section space-y-3 border-t pt-4">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="署名" en="Signatures" />
          </h2>
          <SignatureBlock signatures={report.signatures ?? []} />
        </section>

        <section className="print-section space-y-3 border-t pt-4">
          <h2 className="text-base font-medium">
            <BilingualLabel ja="監査トレイル" en="Audit trail" />
          </h2>
          <AuditTrailTimeline events={events ?? []} />
        </section>
      </div>
    </>
  );
}

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .print-doc {
    max-width: none;
    margin: 0;
    padding: 0;
    color: black;
  }
  .print-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Keep severity badge colors instead of stripping them */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Hide the verify button -- it's interactive, not a printable artifact */
  button { display: none !important; }
  /* Hide back link by extension since it's wrapped in .no-print already */
}
@page { margin: 1.5cm; }
`;
