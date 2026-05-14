import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ComposerInput } from '@/lib/types/delivery';
import { deliveriesForProjectKey } from '@/hooks/useDeliveriesForProject';

export type CreateDeliveryResult =
  | { delivery_id: string; status: 'sent'; resend_message_id: string }
  | { delivery_id: string; status: 'scheduled'; scheduled_for: string };

// Calls the send-delivery Edge Function. The function orchestrates the
// full immediate path (sanitize + create_delivery RPC + attachments +
// Resend + mark_delivery_sent_user) or returns early on the scheduled
// path. Component callers should branch on result.status to render the
// "sent" vs "scheduled" success state.
//
// FunctionsHttpError unwrap matches the Phase 4 SignAuditReport pattern:
// supabase-js wraps non-2xx in a generic error; the real P0004 gate code
// (e.g. 'audit_not_finalized', 'variant_not_approved') lives in
// error.context.json().error.message and is what the dialog should
// surface via its localized-message map.
export function useCreateDelivery(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<CreateDeliveryResult, Error, ComposerInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke<{
        data: CreateDeliveryResult | null;
        error: { code: string; message: string } | null;
      }>('send-delivery', { body: input });
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
      if (!data || data.error) {
        throw new Error(data?.error?.message ?? 'Send request failed');
      }
      if (!data.data) throw new Error('Send response missing data');
      return data.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      qc.invalidateQueries({ queryKey: deliveriesForProjectKey(projectId) });
      // Project status flips to 'delivered' on first successful send;
      // invalidate the project + summary caches so the list view refreshes.
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['project_summary'] });
    },
  });
}
