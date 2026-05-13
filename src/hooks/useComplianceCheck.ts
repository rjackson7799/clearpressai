import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { complianceFindingsKey } from '@/hooks/useComplianceFindings';
import type { ComplianceFindingRow } from '@/types/domain';

export interface ComplianceCheckError {
  code:
    | 'permission_denied'
    | 'validation_error'
    | 'not_found'
    | 'ai_error'
    | 'internal_error';
  message: string;
  details?: unknown;
}

export interface ComplianceCheckResult {
  findings_by_variant: Record<string, ComplianceFindingRow[]>;
  prompt_version: string;
}

export interface ComplianceCheckInput {
  variant_ids: string[];
}

export function useComplianceCheck(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<
    ComplianceCheckResult,
    ComplianceCheckError,
    ComplianceCheckInput
  >({
    mutationFn: async ({ variant_ids }) => {
      const { data, error } = await supabase.functions.invoke(
        'compliance-check',
        { body: { variant_ids } },
      );

      if (error) {
        const ctx = (
          error as { context?: { json?: { error?: ComplianceCheckError } } }
        ).context?.json;
        if (ctx?.error) throw ctx.error;
        throw {
          code: 'internal_error',
          message: error.message ?? 'Unknown function error',
        } satisfies ComplianceCheckError;
      }

      const body = data as {
        data: ComplianceCheckResult | null;
        error: ComplianceCheckError | null;
      };
      if (body.error) throw body.error;
      if (!body.data) {
        throw {
          code: 'internal_error',
          message: 'Empty response from compliance-check',
        } satisfies ComplianceCheckError;
      }
      return body.data;
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
