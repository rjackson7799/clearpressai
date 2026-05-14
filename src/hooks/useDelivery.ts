import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Delivery } from '@/types/domain';

export const deliveryKey = (id: string) => ['delivery', id] as const;

// Detail-view source. Pulls full row including delivery_snapshot.
export function useDelivery(deliveryId: string | undefined) {
  return useQuery<Delivery>({
    queryKey: deliveryKey(deliveryId ?? ''),
    enabled: Boolean(deliveryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
