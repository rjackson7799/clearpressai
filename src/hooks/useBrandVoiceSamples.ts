import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { extractTextFromFile, validateFile } from '@/lib/utils/file-extraction';
import type { BrandVoiceSample } from '@/types/domain';

const STORAGE_BUCKET = 'brand-voice-samples';
const samplesKey = (clientId: string) =>
  ['brand-voice-samples', clientId] as const;

export function useBrandVoiceSamples(clientId: string | undefined) {
  return useQuery({
    queryKey: samplesKey(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<BrandVoiceSample[]> => {
      const { data, error } = await supabase
        .from('brand_voice_samples')
        .select('*')
        .eq('client_id', clientId!)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export interface UploadSampleInput {
  file: File;
}

export function useUploadSample(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file }: UploadSampleInput): Promise<BrandVoiceSample> => {
      validateFile(file);
      const { text } = await extractTextFromFile(file);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const storagePath = `${clientId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: row, error: insertError } = await supabase
        .from('brand_voice_samples')
        .insert({
          client_id: clientId,
          filename: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          byte_size: file.size,
          content_text: text,
          uploaded_by: auth.user.id,
        })
        .select('*')
        .single();

      if (insertError) {
        const { error: cleanupError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        if (cleanupError) {
          console.warn(
            `Storage cleanup failed for ${storagePath}:`,
            cleanupError,
          );
        }
        throw insertError;
      }
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: samplesKey(clientId) });
      qc.invalidateQueries({ queryKey: ['brand-voice-profile', clientId] });
    },
  });
}

export function useDeleteSample(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sample: BrandVoiceSample): Promise<void> => {
      const { error: dbError } = await supabase
        .from('brand_voice_samples')
        .delete()
        .eq('id', sample.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([sample.storage_path]);
      if (storageError) {
        console.warn(
          `Storage delete failed for ${sample.storage_path}:`,
          storageError,
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: samplesKey(clientId) });
    },
  });
}
