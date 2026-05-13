import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { variantsKey } from '@/hooks/useVariants';
import type { ContentVariant } from '@/types/domain';

export interface UpdateVariantInput {
  variantId: string;
  body_text: string;
}

export function useUpdateVariant(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ContentVariant, Error, UpdateVariantInput>({
    mutationFn: async ({ variantId, body_text }) => {
      // Codepoint-correct char count (Array.from iterates code points, not
      // UTF-16 code units — important for Japanese).
      const charCount = Array.from(body_text).length;
      const readingTimeSeconds = Math.ceil(charCount / 6);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('content_variants')
        .update({
          body_text,
          char_count: charCount,
          reading_time_seconds: readingTimeSeconds,
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
