import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { variantsKey } from '@/hooks/useVariants';
import type { ContentVariant } from '@/types/domain';

export interface ApproveVariantInput {
  variantId: string;
  approved: boolean;
}

export function useApproveVariant(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ContentVariant, Error, ApproveVariantInput>({
    mutationFn: async ({ variantId, approved }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('content_variants')
        .update({
          internal_approved: approved,
          internal_approved_by: approved ? auth.user.id : null,
          internal_approved_at: approved ? now : null,
          updated_at: now,
        })
        .eq('id', variantId)
        .select('*')
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
