import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const hasSamplesKey = ['brand-voice-samples', 'exists'] as const;

export function useHasBrandVoiceSamples() {
  return useQuery({
    queryKey: hasSamplesKey,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('brand_voice_samples')
        .select('id')
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
}
