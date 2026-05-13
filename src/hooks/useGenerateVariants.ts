import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { variantsKey } from '@/hooks/useVariants';
import type { ContentVariant } from '@/types/domain';

export interface GenerateVariantsError {
  code:
    | 'permission_denied'
    | 'validation_error'
    | 'not_found'
    | 'ai_error'
    | 'internal_error';
  message: string;
  details?: unknown;
}

export interface GenerateVariantsInput {
  variant_index?: 1 | 2 | 3;
}

export interface GenerateVariantsResult {
  variants: ContentVariant[];
}

export function useGenerateVariants(contentItemId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<
    GenerateVariantsResult,
    GenerateVariantsError,
    GenerateVariantsInput
  >({
    mutationFn: async ({ variant_index }) => {
      if (!contentItemId) {
        throw {
          code: 'validation_error',
          message: 'No content_item_id provided',
        } satisfies GenerateVariantsError;
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-variants',
        {
          body: {
            content_item_id: contentItemId,
            ...(variant_index !== undefined ? { variant_index } : {}),
          },
        },
      );

      if (error) {
        const ctx = (
          error as { context?: { json?: { error?: GenerateVariantsError } } }
        ).context?.json;
        if (ctx?.error) throw ctx.error;
        throw {
          code: 'internal_error',
          message: error.message ?? 'Unknown function error',
        } satisfies GenerateVariantsError;
      }

      const body = data as {
        data: GenerateVariantsResult | null;
        error: GenerateVariantsError | null;
      };
      if (body.error) throw body.error;
      if (!body.data) {
        throw {
          code: 'internal_error',
          message: 'Empty response from generate-variants',
        } satisfies GenerateVariantsError;
      }
      return body.data;
    },
    onSuccess: () => {
      if (contentItemId) {
        qc.invalidateQueries({ queryKey: variantsKey(contentItemId) });
      }
    },
  });
}
