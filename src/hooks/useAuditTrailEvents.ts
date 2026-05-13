import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AuditTrailEvent } from "@/types/domain";

export const auditTrailEventsKey = (projectId: string) => [
  "audit_trail_events",
  projectId,
];

// Full audit trail for a project, chronological (oldest first). Backfilled
// rows are interleaved with live rows; consumers tell them apart via
// details.completeness === 'latest_state_only' (see audit-events-display).
export function useAuditTrailEvents(projectId: string | undefined) {
  return useQuery<AuditTrailEvent[]>({
    queryKey: auditTrailEventsKey(projectId ?? ""),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_trail_events")
        .select("*")
        .eq("project_id", projectId!)
        .order("occurred_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
