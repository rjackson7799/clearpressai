import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardFinding } from '@/lib/dashboard-metrics';

const KEY = ['compliance_findings_global'] as const;

// compliance_findings has no project_id — it reaches a project only through
// variant_id → content_variants → content_items. We embed just the id we need
// and flatten it. Only unresolved findings feed every dashboard metric, so we
// filter server-side (resolved history would age poorly).
interface Row {
  id: string;
  severity: string;
  resolution_status: string;
  variant_id: string;
  content_variants: { content_items: { project_id: string } | null } | null;
}

export function useComplianceFindingsGlobal(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: KEY,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<DashboardFinding[]> => {
      const { data, error } = await supabase
        .from('compliance_findings')
        .select(
          'id, severity, resolution_status, variant_id, content_variants!inner(content_items!inner(project_id))',
        )
        .eq('resolution_status', 'unresolved');
      if (error) throw error;
      // The generated embed type can't express the to-one nesting cleanly;
      // cast to the known shape (to-one FKs → objects) and flatten.
      const rows = (data ?? []) as unknown as Row[];
      return rows.map((r) => ({
        id: r.id,
        variant_id: r.variant_id,
        severity: r.severity,
        resolution_status: r.resolution_status,
        project_id: r.content_variants?.content_items?.project_id ?? null,
      }));
    },
  });
}
