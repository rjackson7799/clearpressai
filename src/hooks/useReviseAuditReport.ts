import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { auditReportsKey } from "@/hooks/useAuditReports";
import { auditTrailEventsKey } from "@/hooks/useAuditTrailEvents";
import { latestAuditReportKey } from "@/hooks/useLatestAuditReport";
import { auditReportKey } from "@/hooks/useAuditReport";
import type { AuditReport } from "@/types/domain";

export interface ReviseAuditReportInput {
  auditReportId: string;
  comment: string;
}

// Calls the revise_audit_report RPC. Clones the head-of-chain finalized
// report into a new draft with version_minor + 1. Rejects when source is
// not finalized, not the head of the chain, or a draft already exists for
// the project.
export function useReviseAuditReport(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<AuditReport, Error, ReviseAuditReportInput>({
    mutationFn: async ({ auditReportId, comment }) => {
      const { data, error } = await supabase
        .rpc("revise_audit_report", {
          p_audit_report_id: auditReportId,
          p_comment: comment,
        })
        .single();
      if (error) throw error;
      return data as AuditReport;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: auditReportKey(vars.auditReportId) });
      if (!projectId) return;
      qc.invalidateQueries({ queryKey: auditReportsKey(projectId) });
      qc.invalidateQueries({ queryKey: latestAuditReportKey(projectId) });
      qc.invalidateQueries({ queryKey: auditTrailEventsKey(projectId) });
    },
  });
}
