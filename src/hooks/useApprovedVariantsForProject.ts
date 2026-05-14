import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ContentItem, ContentVariant } from '@/types/domain';

export interface ApprovedVariantRow extends ContentVariant {
  content_item: Pick<ContentItem, 'id' | 'content_type' | 'content_sub_type'>;
}

export const approvedVariantsForProjectKey = (projectId: string) =>
  ['approved_variants_for_project', projectId] as const;

// Powers the DeliveryComposer's variant picker. Lists every approved
// variant in the project, joined with its parent content_item so the
// picker can group/label by content_sub_type and content_type.
//
// Includes 'updated_at <= internal_approved_at' filter? No -- the
// composer's pre-send checklist surfaces post-approval edits as a
// distinct warning. The list shows all approved; the gate disables
// Send when any selected variant has been edited since approval.
export function useApprovedVariantsForProject(projectId: string | undefined) {
  return useQuery<ApprovedVariantRow[]>({
    queryKey: approvedVariantsForProjectKey(projectId ?? ''),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_variants')
        .select(
          '*, content_item:content_items!inner(id, project_id, content_type, content_sub_type)',
        )
        .eq('internal_approved', true)
        .eq('content_item.project_id', projectId!)
        .order('variant_index', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ApprovedVariantRow[];
    },
  });
}
