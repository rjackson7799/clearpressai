import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complianceFindingsKey } from '@/hooks/useComplianceFindings';
import type {
  ComplianceFindingRow,
  ComplianceResolutionStatus,
} from '@/types/domain';

export interface ResolveFindingInput {
  findingId: string;
  status: ComplianceResolutionStatus;
}

export function useResolveFinding(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ComplianceFindingRow, Error, ResolveFindingInput>({
    mutationFn: async ({ findingId, status }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const update: {
        resolution_status: ComplianceResolutionStatus;
        resolved_by: string | null;
        resolved_at: string | null;
      } =
        status === 'unresolved'
          ? {
              resolution_status: 'unresolved',
              resolved_by: null,
              resolved_at: null,
            }
          : {
              resolution_status: status,
              resolved_by: auth.user.id,
              resolved_at: new Date().toISOString(),
            };

      const { data, error } = await supabase
        .from('compliance_findings')
        .update(update)
        .eq('id', findingId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (contentItemId) {
        qc.invalidateQueries({
          queryKey: complianceFindingsKey(contentItemId),
        });
      }
    },
  });
}
