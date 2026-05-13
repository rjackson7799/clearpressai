import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AuditReport } from "@/types/domain";

export const auditReportsKey = (projectId: string) => [
  "audit_reports",
  projectId,
];

// List all audit reports for a project, newest first.
export function useAuditReports(projectId: string | undefined) {
  return useQuery<AuditReport[]>({
    queryKey: auditReportsKey(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_reports")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
