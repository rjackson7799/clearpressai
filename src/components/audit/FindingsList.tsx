import { Badge } from "@/components/ui/badge";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import {
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  SEVERITY_VARIANT,
} from "@/lib/severity";
import type { SnapshotFinding } from "@/types/audit-snapshot";

// Read-only severity-grouped findings render used by AuditReportPage and
// PrintAuditReportPage. CompliancePanel is the interactive analog.
export function FindingsList({ findings }: { findings: SnapshotFinding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        <BilingualLabel ja="指摘事項なし" en="No findings" />
      </p>
    );
  }

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: findings.filter((f) => f.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map(({ severity, items }) => (
        <div key={severity} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={SEVERITY_VARIANT[severity]}>
              {SEVERITY_LABEL[severity].ja}
              <span className="text-xs opacity-70 ml-1">
                {SEVERITY_LABEL[severity].en}
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>
          <ul className="space-y-2 ml-1">
            {items.map((f) => (
              <li
                key={f.id}
                className="rounded-md border bg-card px-3 py-2 text-sm space-y-1"
              >
                <p className="font-medium">{f.explanation}</p>
                <p className="text-xs text-muted-foreground">
                  {f.regulation_reference}
                </p>
                {f.source_text && (
                  <p className="text-xs">
                    <span className="text-muted-foreground">
                      <BilingualLabel ja="該当箇所:" en="Source:" />
                    </span>{" "}
                    <span className="italic">{f.source_text}</span>
                  </p>
                )}
                {f.suggested_correction && (
                  <p className="text-xs">
                    <span className="text-muted-foreground">
                      <BilingualLabel ja="修正案:" en="Suggested:" />
                    </span>{" "}
                    {f.suggested_correction}
                  </p>
                )}
                <p className="text-xs">
                  <Badge variant="outline" className="font-normal">
                    {f.resolution_status}
                  </Badge>
                  {f.resolved_at && (
                    <span className="text-muted-foreground ml-2">
                      {new Date(f.resolved_at).toLocaleString()}
                      {f.resolved_by?.name ? ` · ${f.resolved_by.name}` : null}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
