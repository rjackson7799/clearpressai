import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { complianceFindingsKey } from "@/hooks/useComplianceFindings";

export interface AcknowledgeFindingInput {
  findingId: string;
}

// Calls the acknowledge_finding RPC. Rejects when the finding is already
// resolved (status != 'unresolved'). Bumps no variant fields, so no stale
// cascade.
export function useAcknowledgeFinding(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, AcknowledgeFindingInput>({
    mutationFn: async ({ findingId }) => {
      const { data, error } = await supabase.rpc("acknowledge_finding", {
        p_finding_id: findingId,
      });
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
