import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { auditReportsKey } from "@/hooks/useAuditReports";
import { auditTrailEventsKey } from "@/hooks/useAuditTrailEvents";
import { latestAuditReportKey } from "@/hooks/useLatestAuditReport";
import type { AuditReport } from "@/types/domain";

// Calls the assemble_audit_report RPC. Returns the new draft report row.
// Rejects if the project has an open draft, or has no approved variants
// (P0004 messages: draft_report_already_exists, no_approved_variants).
export function useCreateAuditReport(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<AuditReport, Error, void>({
    mutationFn: async () => {
      if (!projectId) throw new Error("Missing projectId");
      const { data, error } = await supabase
        .rpc("assemble_audit_report", { p_project_id: projectId })
        .single();
      if (error) throw error;
      return data as AuditReport;
    },
    onSuccess: () => {
      if (!projectId) return;
      qc.invalidateQueries({ queryKey: auditReportsKey(projectId) });
      qc.invalidateQueries({ queryKey: latestAuditReportKey(projectId) });
      qc.invalidateQueries({ queryKey: auditTrailEventsKey(projectId) });
    },
  });
}
