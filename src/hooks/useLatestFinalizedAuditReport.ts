import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AuditReport } from '@/types/domain';

export const latestFinalizedAuditReportKey = (projectId: string) =>
  ['audit_report_latest_finalized', projectId] as const;

// Pre-send checklist gate #1. Mirrors the server-side
// _latest_finalized_audit_report() helper: head-of-chain by
// (version_major, version_minor), and only returned when status='finalized'.
// 'revised' (prior finalized superseded by a newer signed version) and
// 'draft' (in-progress revision) both produce null.
export function useLatestFinalizedAuditReport(projectId: string | undefined) {
  return useQuery<AuditReport | null>({
    queryKey: latestFinalizedAuditReportKey(projectId ?? ''),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('project_id', projectId!)
        .order('version_major', { ascending: false })
        .order('version_minor', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== 'finalized') return null;
      return data;
    },
  });
}
