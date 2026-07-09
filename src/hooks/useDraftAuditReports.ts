import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DraftAuditItem } from '@/lib/dashboard-metrics';

const KEY = ['audit_reports_draft'] as const;

// All other audit hooks are project-scoped; the dashboard needs the
// cross-project set of assembled-but-unsigned (status='draft') reports.
interface Row {
  id: string;
  project_id: string;
  report_id_display: string;
  projects: { name: string | null } | null;
}

export function useDraftAuditReports(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: KEY,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<DraftAuditItem[]> => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('id, project_id, report_id_display, projects(name)')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Row[];
      return rows.map((r) => ({
        id: r.id,
        project_id: r.project_id,
        report_id_display: r.report_id_display,
        project_name: r.projects?.name ?? null,
      }));
    },
  });
}
