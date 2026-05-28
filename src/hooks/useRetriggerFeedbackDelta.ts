import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { clientFeedbackKey } from './useClientFeedback';

export interface RetriggerResult {
  delta_status: 'succeeded' | 'failed';
}

interface RetriggerEnvelope {
  data: RetriggerResult | null;
  error: { code: string; message: string } | null;
}

// Firm-side manual retry for a client_feedback row whose inline Haiku
// delta-extraction (feedback-submit T4) failed. Targets the partial index
// idx_client_feedback_delta_failed via useClientFeedback's
// delta_generation_status flag. On success, both clientFeedback list and
// the feedback_sourced_guidelines batch are invalidated so the new rows
// surface immediately.
//
// The Edge Function rejects rows that aren't in 'failed' state (409
// not_in_failed_state) so a stale UI click against a since-succeeded row
// doesn't overwrite legitimate state. FunctionsHttpError unwrap follows
// the Phase 4/5 convention.
export function useRetriggerFeedbackDelta(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<RetriggerResult, Error, { feedback_id: string }>({
    mutationFn: async ({ feedback_id }) => {
      const { data, error } = await supabase.functions.invoke<
        RetriggerEnvelope
      >('retrigger-feedback-delta', { body: { feedback_id } });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            const inner = body?.error?.message ?? body?.message;
            if (inner) throw new Error(inner);
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message) {
              throw parseError;
            }
          }
        }
        throw error;
      }
      if (!data) throw new Error('retrigger-feedback-delta returned no data');
      if (data.error) throw new Error(data.error.message);
      if (!data.data) throw new Error('retrigger-feedback-delta missing data');
      return data.data;
    },
    onSuccess: () => {
      if (!clientId) return;
      qc.invalidateQueries({ queryKey: clientFeedbackKey(clientId) });
      qc.invalidateQueries({
        queryKey: ['feedback_sourced_guidelines', clientId],
      });
    },
  });
}
