import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ComplianceFindingRow, ContentVariant } from '@/types/domain';

export const complianceFindingsKey = (contentItemId: string) =>
  ['compliance_findings', contentItemId] as const;

export interface ComplianceFindingWithStale extends ComplianceFindingRow {
  is_stale: boolean;
}

/**
 * Loads all compliance findings for the variants belonging to a content_item
 * and decorates each with `is_stale = variant.updated_at > finding.created_at`
 * (D10 — without a schema change, the UI surfaces "needs re-check" once a
 * user edits the body after findings were computed).
 */
export function useComplianceFindings(
  contentItemId: string | undefined,
  variants: ContentVariant[] | undefined,
) {
  const variantIds = (variants ?? []).map((v) => v.id);
  return useQuery({
    queryKey: [...complianceFindingsKey(contentItemId ?? ''), variantIds],
    enabled: Boolean(contentItemId) && variantIds.length > 0,
    queryFn: async (): Promise<Record<string, ComplianceFindingWithStale[]>> => {
      const { data, error } = await supabase
        .from('compliance_findings')
        .select('*')
        .in('variant_id', variantIds);
      if (error) throw error;

      const variantUpdatedAt = new Map(
        (variants ?? []).map((v) => [v.id, v.updated_at]),
      );

      const byVariant: Record<string, ComplianceFindingWithStale[]> = {};
      for (const id of variantIds) {
        byVariant[id] = [];
      }
      for (const f of data ?? []) {
        const variantTs = variantUpdatedAt.get(f.variant_id);
        const isStale = variantTs ? variantTs > f.created_at : false;
        const list = byVariant[f.variant_id] ?? [];
        list.push({ ...f, is_stale: isStale });
        byVariant[f.variant_id] = list;
      }
      return byVariant;
    },
  });
}
