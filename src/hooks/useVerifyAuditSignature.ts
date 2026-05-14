import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface VerifyAuditSignatureInput {
  signatureId: string;
}

export interface VerifyAuditSignatureResponse {
  matches: boolean;
  computed_hash: string;
  stored_hash: string;
}

// Calls the verify-audit-signature Edge Function (T7b). The Edge Function
// re-computes HMAC over the persisted canonical_payload using the server
// secret and reports whether it matches the stored signature_hash. This
// is the canonical verification path; src/lib/audit-signature.ts wraps
// this hook for non-component callers. No DB writes, no cache to
// invalidate -- response is consumed inline by the calling component.
export function useVerifyAuditSignature() {
  return useMutation<
    VerifyAuditSignatureResponse,
    Error,
    VerifyAuditSignatureInput
  >({
    mutationFn: async ({ signatureId }) => {
      const { data, error } = await supabase.functions.invoke<{
        data: VerifyAuditSignatureResponse | null;
        error: { code: string; message: string } | null;
      }>("verify-audit-signature", {
        body: { signature_id: signatureId },
      });
      if (error) {
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
        throw new Error(data?.error?.message ?? "Verify request failed");
      }
      if (!data.data) throw new Error("Verify response missing data");
      return data.data;
    },
  });
}
