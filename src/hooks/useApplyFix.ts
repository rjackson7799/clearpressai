import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { variantsKey } from "@/hooks/useVariants";
import { complianceFindingsKey } from "@/hooks/useComplianceFindings";

export interface ApplyFixInput {
  findingId: string;
  variantId: string;
  newBodyText: string;
  newBodyHtml: string | null;
  newCharCount: number;
  newReadingTimeSeconds: number;
}

// Calls the apply_fix PL/pgSQL RPC: variant body update + finding flip to
// 'fixed' in one transaction (I4). Bumps content_variants.updated_at, which
// marks any OTHER findings on the same variant as stale — callers must
// re-run compliance before sign-off (gate I3 #5).
//
// Generated types mark p_new_body_html as non-nullable string but the SQL
// parameter is `text` and accepts NULL; the cast below preserves the
// nullability we want at the wire so existing nulls aren't coerced to ''.
export function useApplyFix(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, ApplyFixInput>({
    mutationFn: async ({
      findingId,
      newBodyText,
      newBodyHtml,
      newCharCount,
      newReadingTimeSeconds,
    }) => {
      const { data, error } = await supabase.rpc("apply_fix", {
        p_finding_id: findingId,
        p_new_body_text: newBodyText,
        p_new_body_html: newBodyHtml as unknown as string,
        p_new_char_count: newCharCount,
        p_new_reading_time_seconds: newReadingTimeSeconds,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (contentItemId) {
        qc.invalidateQueries({ queryKey: variantsKey(contentItemId) });
        qc.invalidateQueries({
          queryKey: complianceFindingsKey(contentItemId),
        });
      }
    },
  });
}
