import { supabase } from "@/lib/supabase";

export interface VerifyAuditSignatureResult {
  matches: boolean;
  computed_hash: string;
  stored_hash: string;
}

/**
 * Verify an audit signature by re-HMACing its persisted canonical_payload
 * via the verify-audit-signature Edge Function. The Edge Function is the
 * only place that holds AUDIT_SIGNING_SECRET; this wrapper exists so
 * non-component callers (CLI ops, future audits) have a single entry
 * point instead of duplicating the fetch shape.
 *
 * Components should use useVerifyAuditSignature() instead — it gives
 * the same result with TanStack Query state (pending, error).
 */
export async function verifyAuditSignature(
  signatureId: string,
): Promise<VerifyAuditSignatureResult> {
  const { data, error } = await supabase.functions.invoke<{
    data: VerifyAuditSignatureResult | null;
    error: { code: string; message: string } | null;
  }>("verify-audit-signature", {
    body: { signature_id: signatureId },
  });
  if (error) throw error;
  if (!data || data.error) {
    throw new Error(data?.error?.message ?? "Verify request failed");
  }
  if (!data.data) throw new Error("Verify response missing data");
  return data.data;
}
