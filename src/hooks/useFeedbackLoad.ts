import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  FeedbackLoadResponseSchema,
  type FeedbackLoadResponse,
} from '@/lib/types/feedback';

export const feedbackLoadKey = (token: string) =>
  ['feedback_load', token] as const;

interface FeedbackLoadEnvelope {
  data: unknown | null;
  error: { code: string; message: string } | null;
}

// Public feedback-page loader. Calls the feedback-load Edge Function and
// parses the response through FeedbackLoadResponseSchema (discriminated
// union: ok | already_submitted | invalid). HTTP 200 for all three branches
// — the status field on the body is the discriminant, NOT the status code.
export function useFeedbackLoad(token: string | undefined) {
  return useQuery<FeedbackLoadResponse>({
    queryKey: feedbackLoadKey(token ?? ''),
    enabled: Boolean(token),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<
        FeedbackLoadEnvelope
      >('feedback-load', { body: { token } });
      if (error) throw error;
      if (!data) throw new Error('feedback-load returned no data');
      if (data.error) throw new Error(data.error.message);
      const parsed = FeedbackLoadResponseSchema.safeParse(data.data);
      if (!parsed.success) {
        throw new Error(
          `feedback-load response shape mismatch: ${parsed.error.message}`,
        );
      }
      return parsed.data;
    },
    retry: false,
    staleTime: 60_000,
  });
}
