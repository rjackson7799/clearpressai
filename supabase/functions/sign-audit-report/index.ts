/**
 * sign-audit-report — Edge Function
 *
 * Finalizes an audit report by computing an HMAC-SHA-256 over a canonical
 * payload using `AUDIT_SIGNING_SECRET` (Supabase secret, never leaves
 * server). The secret IS the trust anchor; the canonical payload + hash
 * are persisted on audit_signatures so the signature is verifiable later
 * without rebuilding from live state.
 *
 * Flow:
 *   1. Validate JWT, resolve signer_id (auth.uid()).
 *   2. Load report; assert status='draft'.
 *   3. Call `_build_audit_snapshot(project_id)` RPC for the canonical
 *      snapshot. Source of truth lives in PL/pgSQL so JS reconstruction
 *      can't drift from the RPC's later equality check.
 *   4. Load signer's full_name + role for the canonical payload.
 *   5. Build canonical_payload = sorted keys of
 *      { project_id, report_id, report_snapshot, signed_at, signer_id,
 *        signer_name_snapshot, signer_role_snapshot, version }.
 *   6. HMAC the canonicalized string with the secret.
 *   7. Call finalize_audit_report RPC with (report_id, hex_hash,
 *      canonical_payload). The RPC enforces I3 gates inside its
 *      transaction and rejects if its server-built snapshot differs
 *      from canonical_payload.report_snapshot.
 *   8. Return the finalized report + signature.
 *
 * Note on signed_at: the canonical_payload.signed_at is computed in JS
 * here, then passed through to the RPC. The audit_signatures.signed_at
 * column is set by the column default (now()) inside the transaction.
 * These can differ by milliseconds. Verification uses canonical_payload,
 * so the HMAC stays consistent; UI should display the column value as
 * the authoritative DB record.
 */

import { z } from "zod";
import { handlePreflight } from "../_shared/cors.ts";
import { jsonResponse, jsonError } from "../_shared/errors.ts";
import {
  AuthError,
  createSupabaseFromRequest,
  getUserIdFromAuth,
} from "../_shared/auth.ts";
import { canonicalize, hmacSha256Hex } from "../_shared/canonical.ts";

const InputSchema = z.object({
  audit_report_id: z.string().uuid(),
});

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonError(405, {
      code: "validation_error",
      message: "Method not allowed",
    });
  }

  const secret = Deno.env.get("AUDIT_SIGNING_SECRET");
  if (!secret) {
    return jsonError(500, {
      code: "internal_error",
      message: "Missing AUDIT_SIGNING_SECRET",
    });
  }

  let supabase;
  let signerId: string;
  try {
    supabase = createSupabaseFromRequest(req);
    signerId = await getUserIdFromAuth(supabase);
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError(401, { code: "permission_denied", message: e.message });
    }
    return jsonError(500, {
      code: "internal_error",
      message: (e as Error).message,
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError(400, {
      code: "validation_error",
      message: "Body must be valid JSON",
    });
  }
  const parsed = InputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      code: "validation_error",
      message: "Invalid input",
      details: parsed.error.issues,
    });
  }
  const { audit_report_id } = parsed.data;

  try {
    const { data: report, error: reportError } = await supabase
      .from("audit_reports")
      .select("id, project_id, status, version")
      .eq("id", audit_report_id)
      .single();
    if (reportError || !report) {
      return jsonError(404, {
        code: "not_found",
        message: `Report not found: ${reportError?.message ?? "unknown"}`,
      });
    }
    if (report.status !== "draft") {
      return jsonError(409, {
        code: "validation_error",
        message: `Report status is '${report.status}', expected 'draft'`,
      });
    }

    const { data: snapshot, error: snapshotError } = await supabase.rpc(
      "_build_audit_snapshot",
      { p_project_id: report.project_id },
    );
    if (snapshotError) {
      throw new Error(`Snapshot build failed: ${snapshotError.message}`);
    }

    const { data: signer, error: signerError } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", signerId)
      .single();
    if (signerError || !signer) {
      throw new Error(
        `Signer lookup failed: ${signerError?.message ?? "no row"}`,
      );
    }

    const signedAt = new Date().toISOString();
    const canonicalPayload = {
      project_id: report.project_id,
      report_id: report.id,
      report_snapshot: snapshot,
      signed_at: signedAt,
      signer_id: signerId,
      signer_name_snapshot: signer.full_name,
      signer_role_snapshot: signer.role,
      version: report.version,
    };
    const canonicalString = canonicalize(canonicalPayload);
    const signatureHash = await hmacSha256Hex(secret, canonicalString);

    const { data: finalized, error: finalizeError } = await supabase
      .rpc("finalize_audit_report", {
        p_audit_report_id: audit_report_id,
        p_signature_hash: signatureHash,
        p_canonical_payload: canonicalPayload,
      })
      .single();
    if (finalizeError) {
      // PL/pgSQL P0004 messages map to gate-violation strings like
      // 'unresolved_blockers_exist' or 'compliance_stale'. Surface as 409
      // so the UI can map to a localized explanation.
      if (finalizeError.code === "P0004") {
        return jsonError(409, {
          code: "validation_error",
          message: finalizeError.message,
        });
      }
      throw new Error(`Finalize failed: ${finalizeError.message}`);
    }

    const { data: signature, error: sigError } = await supabase
      .from("audit_signatures")
      .select("*")
      .eq("audit_report_id", audit_report_id)
      .order("signed_at", { ascending: false })
      .limit(1)
      .single();
    if (sigError || !signature) {
      throw new Error(
        `Signature read-back failed: ${sigError?.message ?? "no row"}`,
      );
    }

    return jsonResponse(200, {
      data: { report: finalized, signature },
      error: null,
    });
  } catch (e) {
    return jsonError(500, {
      code: "internal_error",
      message: `Sign failed: ${(e as Error).message}`,
    });
  }
});
