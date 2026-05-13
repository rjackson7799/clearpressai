import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { variantsKey } from "@/hooks/useVariants";
import type { ContentVariant } from "@/types/domain";

export interface ApproveVariantInput {
  variantId: string;
  approved: boolean;
}

// approve_variant RPC handles the approve path atomically (sets the flag +
// writes the variant_approved audit event). Unapprove has no matching RPC
// in v1 and falls back to a direct table write with no audit event. The
// dedicated unapprove_variant RPC is a v2 carry-forward.
export function useApproveVariant(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ContentVariant, Error, ApproveVariantInput>({
    mutationFn: async ({ variantId, approved }) => {
      if (approved) {
        const { data, error } = await supabase
          .rpc("approve_variant", { p_variant_id: variantId })
          .single();
        if (error) throw error;
        return data as ContentVariant;
      }
      const { data, error } = await supabase
        .from("content_variants")
        .update({
          internal_approved: false,
          internal_approved_by: null,
          internal_approved_at: null,
        })
        .eq("id", variantId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (contentItemId) {
        qc.invalidateQueries({ queryKey: variantsKey(contentItemId) });
      }
    },
  });
}
