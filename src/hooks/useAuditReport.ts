import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AuditReport, AuditSignature } from "@/types/domain";

export const auditReportKey = (reportId: string) => ["audit_report", reportId];

export interface AuditReportWithSignatures extends AuditReport {
  signatures: AuditSignature[];
}

// Single audit report joined with all its signatures (chronological).
// Used by AuditReportPage to drive both snapshot-render (when finalized
// or revised) and signature display.
export function useAuditReport(reportId: string | undefined) {
  return useQuery<AuditReportWithSignatures>({
    queryKey: auditReportKey(reportId ?? ""),
    enabled: Boolean(reportId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_reports")
        .select("*, signatures:audit_signatures(*)")
        .eq("id", reportId!)
        .order("signed_at", {
          referencedTable: "audit_signatures",
          ascending: true,
        })
        .single();
      if (error) throw error;
      return data as AuditReportWithSignatures;
    },
  });
}
