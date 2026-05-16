import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const clientFeedbackKey = (clientId: string) =>
  ['client_feedback_for_client', clientId] as const;

export interface ClientFeedbackRow {
  id: string;
  submitted_at: string;
  chosen_variant_id: string | null;
  needs_rework: boolean;
  what_worked: string[];
  what_could_improve: string[];
  free_text_comment: string | null;
  delta_generation_status: 'pending' | 'succeeded' | 'failed';
  delta_error: string | null;
  feedback_token: {
    id: string;
    delivery: {
      id: string;
      subject: string;
      sent_at: string | null;
      recipient_name: string | null;
      project: {
        id: string;
        client_id: string;
      };
    };
  };
  chosen_variant: {
    id: string;
    variant_label: string;
    variant_index: number;
  } | null;
}

// Firm-side feedback list for ClientDetailPage's Feedback tab (T7).
//
// Ownership chain (client_feedback has no direct client_id FK — reviewer fix):
//   client_feedback.feedback_token_id -> feedback_tokens.delivery_id ->
//   deliveries.project_id -> projects.client_id
//
// PostgREST does the filter through the relational select via nested
// !inner joins (parent rows are dropped when no match exists on the joined
// child). chosen_variant is a LEFT join (no !inner) so Needs Rework rows
// (chosen_variant_id IS NULL) survive in the list.
//
// delta_generation_status + delta_error are surfaced for the failed-delta
// badge on the firm UI. Both columns land in migration 0009. The generated
// Database types won't reflect them until T1c runs (post-cloud-apply), so
// the row shape is hand-typed here.
//
// Linked brand_voice_guidelines (source_reference_id = client_feedback.id)
// are NOT eager-loaded here — Postgres has no FK on source_reference_id so
// PostgREST can't auto-embed. Deferred to a follow-up SELECT in the UI
// component (or a Phase 7 polish move that adds a view).
export function useClientFeedback(clientId: string | undefined) {
  return useQuery<ClientFeedbackRow[]>({
    queryKey: clientFeedbackKey(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_feedback')
        // The generated Database type still marks chosen_variant_id as
        // non-null (pre-0009). Cast the select string + the response to
        // sidestep until T1c regenerates types post-cloud-apply.
        .select(
          `
            id, submitted_at, chosen_variant_id, needs_rework,
            what_worked, what_could_improve, free_text_comment,
            delta_generation_status, delta_error,
            feedback_token:feedback_tokens!inner(
              id,
              delivery:deliveries!inner(
                id, subject, sent_at, recipient_name,
                project:projects!inner(id, client_id)
              )
            ),
            chosen_variant:content_variants(
              id, variant_label, variant_index
            )
          ` as unknown as '*',
        )
        .eq('feedback_token.delivery.project.client_id', clientId!)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClientFeedbackRow[];
    },
  });
}
