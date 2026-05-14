import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Delivery } from '@/types/domain';

export const deliveriesForProjectKey = (projectId: string) =>
  ['deliveries_for_project', projectId] as const;

// DeliveriesListPage source. Excludes delivery_snapshot from the SELECT
// (heavy jsonb) -- the list view only needs status / recipient / timing
// columns. useDelivery is the detail view that pulls the snapshot.
export function useDeliveriesForProject(projectId: string | undefined) {
  return useQuery<Array<Omit<Delivery, 'delivery_snapshot'>>>({
    queryKey: deliveriesForProjectKey(projectId ?? ''),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(
          'id, project_id, recipient_email, recipient_name, cc_emails, bcc_emails, subject, body_html, body_text, variant_ids_attached, attachment_format, recommended_variant_id, audit_report_id, status, sent_at, sent_by, created_at',
        )
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<Omit<Delivery, 'delivery_snapshot'>>;
    },
  });
}
