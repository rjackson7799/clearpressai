import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import type { AuditReport, AuditReportStatus } from "@/types/domain";

interface VersionHistoryProps {
  reports: AuditReport[];
  selectedReportId: string | undefined;
  onSelect: (reportId: string) => void;
}

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

// Renders all reports in the project's chain, ordered by version_minor desc
// then version_major desc (created_at desc as tiebreaker since the input
// list is already so ordered by useAuditReports). Selected version is
// visually highlighted; others are clickable to switch.
export function VersionHistory({
  reports,
  selectedReportId,
  onSelect,
}: VersionHistoryProps) {
  if (reports.length <= 1) {
    return null;
  }

  return (
    <section className="rounded-md border bg-card p-4 space-y-3">
      <h2 className="text-base font-medium">
        <BilingualLabel ja="バージョン履歴" en="Version history" />
      </h2>
      <ul className="space-y-2">
        {reports.map((r) => {
          const status = r.status as AuditReportStatus;
          const isSelected = r.id === selectedReportId;
          return (
            <li
              key={r.id}
              className={
                "rounded-md border px-3 py-2 flex items-center justify-between gap-3 flex-wrap " +
                (isSelected ? "border-foreground/40 bg-muted/40" : "")
              }
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs">
                    {r.report_id_display}
                  </span>
                  <Badge variant={STATUS_VARIANT[status]}>
                    {STATUS_LABEL[status].ja}
                    <span className="text-xs opacity-70 ml-1">
                      {STATUS_LABEL[status].en}
                    </span>
                  </Badge>
                  <span className="text-sm">
                    <BilingualLabel ja="バージョン" en="Version" /> {r.version}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <BilingualLabel ja="作成" en="Created" />:{" "}
                  {new Date(r.created_at).toLocaleString()}
                  {r.finalized_at && (
                    <>
                      {" · "}
                      <BilingualLabel ja="確定" en="Finalized" />:{" "}
                      {new Date(r.finalized_at).toLocaleString()}
                    </>
                  )}
                </p>
                {r.reviewer_comments && (
                  <p className="text-xs italic text-muted-foreground">
                    {r.reviewer_comments}
                  </p>
                )}
              </div>
              {isSelected ? (
                <span className="text-xs text-muted-foreground">
                  <BilingualLabel ja="表示中" en="Viewing" />
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(r.id)}
                >
                  <BilingualLabel ja="開く" en="Open" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
