import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AuditReport } from "@/types/domain";

export const latestAuditReportKey = (projectId: string) => [
  "audit_report_latest",
  projectId,
];

// The most recent audit report for a project, or null when none exists.
// Used by editor-read-only gating (I2 corollary): when the latest is
// 'finalized', the VariantEditor renders read-only.
//
// Ordered by version (major, then minor) rather than created_at to match the
// DB's canonical ordering (_latest_finalized_audit_report). Timestamp ordering
// can be ambiguous on ties/backfills; version ordering is monotonic, which the
// lock/unlock invariant relies on (a draft V1.1 must outrank a finalized V1.0).
export function useLatestAuditReport(projectId: string | undefined) {
  return useQuery<AuditReport | null>({
    queryKey: latestAuditReportKey(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_reports")
        .select("*")
        .eq("project_id", projectId!)
        .order("version_major", { ascending: false })
        .order("version_minor", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
