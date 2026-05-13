/**
 * verify-audit-signature — Edge Function
 *
 * Canonical verification path for audit signatures. Loads the persisted
 * canonical_payload, re-canonicalizes it using the same helper as
 * sign-audit-report, re-HMACs with AUDIT_SIGNING_SECRET, compares to
 * the stored signature_hash. No DB writes; idempotent.
 *
 * This is invoked by the "Verify" button in AuditReportPage (T8), and
 * wrapped client-side by src/lib/audit-signature.ts. It is NOT a one-off
 * ops script.
 */

import { z } from "zod";
import { handlePreflight } from "../_shared/cors.ts";
import { jsonResponse, jsonError } from "../_shared/errors.ts";
import {
  AuthError,
  createSupabaseFromRequest,
} from "../_shared/auth.ts";
import { canonicalize, hmacSha256Hex } from "../_shared/canonical.ts";

const InputSchema = z.object({
  signature_id: z.string().uuid(),
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
  try {
    supabase = createSupabaseFromRequest(req);
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
  const { signature_id } = parsed.data;

  try {
    const { data: signatureRow, error: sigError } = await supabase
      .from("audit_signatures")
      .select("canonical_payload, signature_hash")
      .eq("id", signature_id)
      .single();
    if (sigError || !signatureRow) {
      return jsonError(404, {
        code: "not_found",
        message: `Signature not found: ${sigError?.message ?? "unknown"}`,
      });
    }

    const canonicalString = canonicalize(signatureRow.canonical_payload);
    const computedHash = await hmacSha256Hex(secret, canonicalString);

    return jsonResponse(200, {
      data: {
        matches: computedHash === signatureRow.signature_hash,
        computed_hash: computedHash,
        stored_hash: signatureRow.signature_hash,
      },
      error: null,
    });
  } catch (e) {
    return jsonError(500, {
      code: "internal_error",
      message: `Verify failed: ${(e as Error).message}`,
    });
  }
});
