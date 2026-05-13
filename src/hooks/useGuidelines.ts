import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  BrandVoiceGuideline,
  GuidelineSourceType,
} from '@/types/domain';

const guidelinesKey = (clientId: string) =>
  ['guidelines', clientId] as const;

export function useGuidelines(clientId: string | undefined) {
  return useQuery({
    queryKey: guidelinesKey(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<BrandVoiceGuideline[]> => {
      const { data, error } = await supabase
        .from('brand_voice_guidelines')
        .select('*')
        .eq('client_id', clientId!)
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateGuidelineInput {
  guideline_text: string;
  source_type: GuidelineSourceType;
}

export function useCreateGuideline(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: CreateGuidelineInput,
    ): Promise<BrandVoiceGuideline> => {
      const { data, error } = await supabase
        .from('brand_voice_guidelines')
        .insert({
          client_id: clientId,
          guideline_text: input.guideline_text,
          source_type: input.source_type,
          active: true,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guidelinesKey(clientId) });
    },
  });
}

export function useArchiveGuideline(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('brand_voice_guidelines')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: guidelinesKey(clientId) });
    },
  });
}
