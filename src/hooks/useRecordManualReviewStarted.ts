import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RecordManualReviewStartedInput {
  projectId: string;
  variantId: string;
}

// Calls record_manual_review_started, which is idempotent per
// (project_id, variant_id, actor_id) tuple. Client may fire eagerly on
// first render of each variant — duplicate calls insert no extra rows.
// No cache invalidation: this only writes to audit_trail_events which
// the variant-review UI doesn't read.
export function useRecordManualReviewStarted() {
  return useMutation<void, Error, RecordManualReviewStartedInput>({
    mutationFn: async ({ projectId, variantId }) => {
      const { error } = await supabase.rpc("record_manual_review_started", {
        p_project_id: projectId,
        p_variant_id: variantId,
      });
      if (error) throw error;
    },
  });
}
