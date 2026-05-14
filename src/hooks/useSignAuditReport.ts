import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { auditReportsKey } from "@/hooks/useAuditReports";
import { auditReportKey } from "@/hooks/useAuditReport";
import { auditTrailEventsKey } from "@/hooks/useAuditTrailEvents";
import { latestAuditReportKey } from "@/hooks/useLatestAuditReport";
import type { AuditReport, AuditSignature } from "@/types/domain";

export interface SignAuditReportInput {
  auditReportId: string;
}

export interface SignAuditReportResponse {
  report: AuditReport;
  signature: AuditSignature;
}

// Calls the sign-audit-report Edge Function (T7). The Edge Function holds
// the HMAC secret, builds the canonical payload server-side, computes the
// signature hash, then calls finalize_audit_report RPC which enforces the
// seven I3 gates inside its transaction. The client never sees the secret.
// On success, predecessor reports cascade to 'revised' in the same
// transaction so we invalidate the project-wide list as well.
export function useSignAuditReport(projectId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<SignAuditReportResponse, Error, SignAuditReportInput>({
    mutationFn: async ({ auditReportId }) => {
      const { data, error } = await supabase.functions.invoke<{
        data: SignAuditReportResponse | null;
        error: { code: string; message: string } | null;
      }>("sign-audit-report", {
        body: { audit_report_id: auditReportId },
      });
      if (error) {
        // supabase-js v2 wraps non-2xx responses in FunctionsHttpError with a
        // generic message; the real error body is in error.context (Response).
        // Unwrap it so the user sees the actual P0004 gate or 500 cause
        // instead of "Edge Function returned a non-2xx status code".
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
        throw new Error(data?.error?.message ?? "Sign request failed");
      }
      if (!data.data) throw new Error("Sign response missing data");
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: auditReportKey(vars.auditReportId) });
      if (!projectId) return;
      qc.invalidateQueries({ queryKey: auditReportsKey(projectId) });
      qc.invalidateQueries({ queryKey: latestAuditReportKey(projectId) });
      qc.invalidateQueries({ queryKey: auditTrailEventsKey(projectId) });
    },
  });
}
