/**
 * feedback-load — Edge Function (--no-verify-jwt, anonymous)
 *
 * Phase 5 ships the LOADER half of the feedback magic-link experience. The
 * actual feedback page is Phase 6; this endpoint exists now so the magic-
 * link works end-to-end at hand-off.
 *
 * Trust model:
 *   - Caller is anonymous. Auth is by holding the 32-byte URL-safe-base64
 *     token only.
 *   - Service-role client is used for the lookup; RLS does NOT gate
 *     feedback_tokens reads in this code path by design.
 *   - External response collapses to opaque {error:'token_invalid'} on any
 *     failure (not found / expired / format mismatch). The internal reason
 *     lives in server logs only -- prevents timing + content side-channels
 *     that would otherwise help an attacker probe the token namespace.
 *   - 32 bytes of entropy = 256 bits; brute force is infeasible even with
 *     no rate limit. v2 will add per-IP + per-token rate limits.
 *
 * Token consumption:
 *   - used_at is NOT a gate here. The link is repeatable until expiry;
 *     only feedback-submit (Phase 6) flips used_at.
 *
 * Response shape (anonymous-safe subset of delivery_snapshot):
 *   - delivery: subject, recipient_name, sent_at, audit_report_version
 *   - project: name
 *   - content_item: content_sub_type
 *   - variants: [{ id, variant_label, variant_index, body_html, body_text,
 *                  variation_directive, char_count }]
 *   - recommended_variant_id
 *   - expires_at
 * Explicitly EXCLUDED (would leak internal process to anonymous callers):
 *   internal user names, sender email, BCC list, compliance findings,
 *   internal_approved_at, scheduling_warnings.
 */
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import { isValidTokenFormat } from '../_shared/magic-link.ts';
import type {
  DeliverySnapshot,
  FeedbackLoadResponse,
} from '../_shared/types-delivery.ts';

const InputSchema = z.object({ token: z.string() });

type Reason =
  | 'token_format_mismatch'
  | 'token_not_found'
  | 'token_expired'
  | 'delivery_not_found'
  | 'snapshot_missing';

function opaqueInvalid(reason: Reason, token: string): Response {
  console.warn(
    JSON.stringify({ event: 'token_invalid', reason, token_prefix: token.slice(0, 4) }),
  );
  return jsonError(404, { code: 'not_found', message: 'token_invalid' });
}

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return jsonError(405, {
      code: 'validation_error',
      message: 'Method not allowed',
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError(400, {
      code: 'validation_error',
      message: 'Body must be valid JSON',
    });
  }
  const parsed = InputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      code: 'validation_error',
      message: 'Invalid input',
    });
  }
  const { token } = parsed.data;

  if (!isValidTokenFormat(token)) {
    return opaqueInvalid('token_format_mismatch', token);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
  }
  const supabase = createClient(url, serviceKey);

  const { data: tokenRow, error: tokenErr } = await supabase
    .from('feedback_tokens')
    .select('delivery_id, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (tokenErr) {
    return jsonError(500, {
      code: 'internal_error',
      message: `feedback_tokens lookup failed: ${tokenErr.message}`,
    });
  }
  if (!tokenRow) {
    return opaqueInvalid('token_not_found', token);
  }
  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return opaqueInvalid('token_expired', token);
  }

  const { data: delivery, error: dErr } = await supabase
    .from('deliveries')
    .select(
      'id, subject, recipient_name, sent_at, delivery_snapshot, recommended_variant_id',
    )
    .eq('id', tokenRow.delivery_id)
    .maybeSingle();
  if (dErr) {
    return jsonError(500, {
      code: 'internal_error',
      message: `deliveries lookup failed: ${dErr.message}`,
    });
  }
  if (!delivery) {
    return opaqueInvalid('delivery_not_found', token);
  }
  const snapshot = delivery.delivery_snapshot as DeliverySnapshot | null;
  if (!snapshot) {
    return opaqueInvalid('snapshot_missing', token);
  }

  const response: FeedbackLoadResponse = {
    delivery: {
      subject: delivery.subject,
      recipient_name: delivery.recipient_name ?? null,
      sent_at: delivery.sent_at ?? null,
      audit_report_version: `${snapshot.audit_report.version_major}.${snapshot.audit_report.version_minor}`,
    },
    project: { name: snapshot.project.name },
    content_item: { content_sub_type: snapshot.content_item.content_sub_type },
    variants: snapshot.variants.map((v) => ({
      id: v.id,
      variant_label: v.variant_label,
      variant_index: v.variant_index,
      body_html: v.body_html,
      body_text: v.body_text,
      variation_directive: v.variation_directive,
      char_count: v.char_count,
    })),
    recommended_variant_id: delivery.recommended_variant_id ?? null,
    expires_at: tokenRow.expires_at,
  };

  return jsonResponse(200, { data: response, error: null });
});
