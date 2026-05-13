import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  BrandVoiceProfileRow,
  BrandVoiceProfileUpdate,
} from '@/types/domain';

const profileKey = (clientId: string) =>
  ['brand-voice-profile', clientId] as const;

export function useBrandVoiceProfile(clientId: string | undefined) {
  return useQuery({
    queryKey: profileKey(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<BrandVoiceProfileRow | null> => {
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('client_id', clientId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Editable subset — never overwrites audit columns
 * (extraction_run_id, prompt_version, model_used, last_extracted_at).
 */
export interface EditableProfile {
  tone_keywords: string[];
  stylistic_patterns: string;
  preferred_vocabulary: string[];
  words_to_avoid: string[];
  signature_phrases: string[];
  length_norms: Record<string, string>;
}

export function useUpdateBrandVoiceProfile(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: EditableProfile,
    ): Promise<BrandVoiceProfileRow> => {
      const payload: BrandVoiceProfileUpdate = {
        ...input,
        user_edited: true,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .update(payload)
        .eq('client_id', clientId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKey(clientId) });
    },
  });
}
