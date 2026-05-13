import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ContentVariant } from '@/types/domain';

export const variantsKey = (contentItemId: string) =>
  ['variants', contentItemId] as const;

export function useVariantsForContentItem(contentItemId: string | undefined) {
  return useQuery({
    queryKey: variantsKey(contentItemId ?? ''),
    enabled: Boolean(contentItemId),
    queryFn: async (): Promise<ContentVariant[]> => {
      const { data, error } = await supabase
        .from('content_variants')
        .select('*')
        .eq('content_item_id', contentItemId!)
        .order('variant_index', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
