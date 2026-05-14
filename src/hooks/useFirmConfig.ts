import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FirmConfigPublic {
  from_name: string;
  from_email: string;
  reply_to_email: string;
}

export const firmConfigKey = ['firm_config_public'] as const;

// Browser-safe sender display values. The RPC is SECURITY DEFINER and
// returns ONLY the three display fields the composer banner needs; never
// DEFAULT_BCC_EMAILS, never API keys. Server-side BCC merge happens in
// create_delivery from the same app_config table.
export function useFirmConfig() {
  return useQuery<FirmConfigPublic>({
    queryKey: firmConfigKey,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_firm_config_public');
      if (error) throw error;
      return data as unknown as FirmConfigPublic;
    },
  });
}
