import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MIN_USABLE_CHARS } from '@/lib/utils/file-extraction';
import type { BrandVoiceSample } from '@/types/domain';

export interface ExtractVoiceResult {
  profile: unknown;
  guideline_id: string | null;
  extraction_run_id: string;
  model_used: string;
  prompt_version: string;
  tokens: { input: number; output: number };
}

export interface ExtractVoiceError {
  code:
    | 'permission_denied'
    | 'validation_error'
    | 'not_found'
    | 'ai_error'
    | 'internal_error';
  message: string;
  details?: unknown;
}

export function useExtractVoice(clientId: string) {
  const qc = useQueryClient();
  return useMutation<ExtractVoiceResult, ExtractVoiceError, BrandVoiceSample[]>({
    mutationFn: async (samples) => {
      const usable = samples.filter(
        (s) => (s.content_text?.length ?? 0) >= MIN_USABLE_CHARS,
      );
      if (usable.length < 5) {
        throw {
          code: 'validation_error',
          message: `Need at least 5 samples with ≥${MIN_USABLE_CHARS} chars`,
        } satisfies ExtractVoiceError;
      }

      const { data, error } = await supabase.functions.invoke('extract-voice', {
        body: {
          client_id: clientId,
          sample_ids: usable.map((s) => s.id),
        },
      });

      if (error) {
        // Edge function errors arrive with a non-2xx — supabase-js puts the
        // parsed body on `error.context.json` for FunctionsHttpError, else
        // surface the raw message.
        const ctx = (error as { context?: { json?: { error?: ExtractVoiceError } } })
          .context?.json;
        if (ctx?.error) throw ctx.error;
        throw {
          code: 'internal_error',
          message: error.message ?? 'Unknown function error',
        } satisfies ExtractVoiceError;
      }

      const body = data as { data: ExtractVoiceResult | null; error: ExtractVoiceError | null };
      if (body.error) throw body.error;
      if (!body.data) {
        throw {
          code: 'internal_error',
          message: 'Empty response from extract-voice',
        } satisfies ExtractVoiceError;
      }
      return body.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brand-voice-profile', clientId] });
      qc.invalidateQueries({ queryKey: ['brand-voice-samples', clientId] });
      qc.invalidateQueries({ queryKey: ['guidelines', clientId] });
    },
  });
}
