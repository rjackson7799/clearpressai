import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  FeedbackSubmitResponseSchema,
  type FeedbackSubmitInput,
  type FeedbackSubmitResponse,
} from '@/lib/types/feedback';
import { feedbackLoadKey } from './useFeedbackLoad';

// The form owns the token via the URL param; mutation callers send the body
// fields only. The hook stitches the token in before the Edge Function call.
export type FeedbackSubmitBody = Omit<FeedbackSubmitInput, 'token'>;

interface FeedbackSubmitEnvelope {
  data: unknown | null;
  error: { code: string; message: string } | null;
}

// Public feedback-page submitter. Calls the feedback-submit Edge Function.
//
// FunctionsHttpError unwrap mirrors Phase 4 SignAuditDialog + Phase 5
// useCreateDelivery: supabase-js wraps non-2xx in a generic error; the real
// gate message (e.g. 'token_invalid') lives in error.context.json().error.message
// and is what the page should surface via its localized-message map (T8).
//
// On success the feedback-load cache is invalidated so a refresh shows the
// 'already_submitted' branch immediately.
export function useFeedbackSubmit(token: string | undefined) {
  const qc = useQueryClient();
  return useMutation<FeedbackSubmitResponse, Error, FeedbackSubmitBody>({
    mutationFn: async (input) => {
      if (!token) throw new Error('Missing token');
      const { data, error } = await supabase.functions.invoke<
        FeedbackSubmitEnvelope
      >('feedback-submit', { body: { token, ...input } });
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
      if (!data) throw new Error('feedback-submit returned no data');
      if (data.error) throw new Error(data.error.message);
      const parsed = FeedbackSubmitResponseSchema.safeParse(data.data);
      if (!parsed.success) {
        throw new Error(
          `feedback-submit response shape mismatch: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    },
    onSuccess: () => {
      if (!token) return;
      qc.invalidateQueries({ queryKey: feedbackLoadKey(token) });
    },
  });
}
