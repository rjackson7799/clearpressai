import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { complianceFindingsKey } from "@/hooks/useComplianceFindings";

export interface ReopenFindingInput {
  findingId: string;
}

// Direct table write — there is no `reopen_finding` RPC in Phase 4. Reopen
// is the inverse of acknowledge/fix and is not audit-bearing in v1.
// Carry-forward: a `reopen_finding` RPC + audit event in v2 if the trail
// needs to record un-resolutions.
export function useReopenFinding(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, ReopenFindingInput>({
    mutationFn: async ({ findingId }) => {
      const { data, error } = await supabase
        .from("compliance_findings")
        .update({
          resolution_status: "unresolved",
          resolved_by: null,
          resolved_at: null,
        })
        .eq("id", findingId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (contentItemId) {
        qc.invalidateQueries({
          queryKey: complianceFindingsKey(contentItemId),
        });
      }
    },
  });
}
