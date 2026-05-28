/**
 * feedback-load — Edge Function (--no-verify-jwt, anonymous)
 *
 * Phase 6 T3 rewrite: routes through the `get_feedback_load_data` RPC for
 * server-side classification (ok / already_submitted / invalid) and emits the
 * curated discriminated-union DTO defined in
 * `src/lib/types/feedback.ts` → `FeedbackLoadResponseSchema`.
 *
 * Trust model:
 *   - Caller is anonymous. Auth is by holding the 43-char URL-safe-base64
 *     token only. 32 bytes of entropy = 256 bits; brute force is infeasible.
 *   - Service-role client; RLS does not gate the lookups here by design.
 *   - External response collapses not-found / expired / format-mismatch to
 *     {status: 'invalid'}. Internal reason lives in server logs only — keeps
 *     timing + content side-channels closed against token-namespace probing.
 *
 * HTTP status: 200 for all three discriminated-union branches. The body's
 * `data.status` field is the discriminant. Only true 5xx errors are non-2xx.
 *
 * Token consumption:
 *   - used_at is NOT a gate at load time. The page can re-load until expiry;
 *     only feedback-submit (Phase 6 T4) flips used_at. used_at becoming non-
 *     null returns `{status: 'already_submitted', submitted_at}` so the page
 *     can render the friendly confirmation card.
 *
 * Curated public DTO (ok branch, anonymous-safe subset of delivery_snapshot):
 *   - delivery: subject, recipient_name, sent_at, audit_report_version
 *   - project: name
 *   - content_item: content_sub_type
 *   - variants: [{ id, variant_label, variant_index, body_html, body_text,
 *                  variation_directive, char_count }]
 *   - recommended_variant_id
 *   - sender: { from_name }  ← added in Phase 6 per PRD §5.5 ("from the firm")
 *   - expires_at
 * Explicitly EXCLUDED (would leak internal process to anonymous callers):
 *   sender.from_email / reply_to_email / sent_by_email_snapshot,
 *   recipient.cc_emails / bcc_emails_effective, audit_report.signature_hash,
 *   scheduling_warnings, compliance findings, internal user names.
 */
import { createClient } from '@supabase/supabase-js';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import { isValidTokenFormat } from '../_shared/magic-link.ts';
import { sanitizeHtml, plainTextToHtml } from '../_shared/sanitize.ts';
import type { DeliverySnapshot } from '../_shared/types-delivery.ts';
import type { FeedbackLoadResponse } from '../_shared/types-feedback.ts';

type InvalidReason =
  | 'token_format_mismatch'
  | 'token_invalid_from_rpc'
  | 'delivery_lookup_failed';

function logOpaque(reason: InvalidReason, token: string): void {
  console.warn(
    JSON.stringify({
      event: 'token_invalid',
      reason,
      token_prefix: token.slice(0, 4),
    }),
  );
}

function invalidResponse(reason: InvalidReason, token: string): Response {
  logOpaque(reason, token);
  const body: FeedbackLoadResponse = { status: 'invalid' };
  return jsonResponse(200, { data: body, error: null });
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
  const token =
    typeof rawBody === 'object' && rawBody !== null && 'token' in rawBody
      ? String((rawBody as { token: unknown }).token)
      : '';

  if (!isValidTokenFormat(token)) {
    return invalidResponse('token_format_mismatch', token);
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

  const { data: rpcData, error: rpcErr } = await supabase.rpc(
    'get_feedback_load_data',
    { p_token: token },
  );
  if (rpcErr) {
    return jsonError(500, {
      code: 'internal_error',
      message: `get_feedback_load_data failed: ${rpcErr.message}`,
    });
  }

  const status = (rpcData as { status?: string } | null)?.status;

  if (status === 'invalid' || !status) {
    return invalidResponse('token_invalid_from_rpc', token);
  }

  if (status === 'already_submitted') {
    const submittedAt = (rpcData as { submitted_at: string }).submitted_at;

    // Phase 7 fix: carry firm name + project name so the confirmation card
    // says "Thank you for your feedback — <firm>" instead of leaving the
    // slot empty. Mirrors the ok-branch follow-up SELECT pattern.
    const { data: snapRow, error: snapErr } = await supabase
      .from('feedback_tokens')
      .select('delivery:deliveries!inner(delivery_snapshot)')
      .eq('token', token)
      .maybeSingle();
    if (snapErr || !snapRow) {
      return invalidResponse('delivery_lookup_failed', token);
    }
    const snap = (snapRow as unknown as {
      delivery: { delivery_snapshot: DeliverySnapshot };
    }).delivery.delivery_snapshot;

    const body: FeedbackLoadResponse = {
      status: 'already_submitted',
      submitted_at: submittedAt,
      sender: { from_name: snap.sender.from_name },
      project: { name: snap.project.name },
    };
    return jsonResponse(200, { data: body, error: null });
  }

  // status === 'ok' — curate the public DTO from delivery_snapshot + a small
  // SELECT for fields not carried in the snapshot (subject, sent_at, expires_at).
  const snapshot = (rpcData as { delivery_snapshot: DeliverySnapshot })
    .delivery_snapshot;

  const { data: lookups, error: lookupErr } = await supabase
    .from('feedback_tokens')
    .select(
      'expires_at, delivery:deliveries!inner(id, subject, sent_at, recommended_variant_id)',
    )
    .eq('token', token)
    .maybeSingle();
  if (lookupErr || !lookups) {
    return invalidResponse('delivery_lookup_failed', token);
  }
  const delivery = (lookups as unknown as {
    expires_at: string;
    delivery: {
      id: string;
      subject: string;
      sent_at: string | null;
      recommended_variant_id: string | null;
    };
  }).delivery;
  const expiresAt = (lookups as unknown as { expires_at: string }).expires_at;

  const body: FeedbackLoadResponse = {
    status: 'ok',
    delivery: {
      subject: delivery.subject,
      recipient_name: snapshot.recipient.name ?? null,
      sent_at: delivery.sent_at ?? null,
      audit_report_version: `${snapshot.audit_report.version_major}.${snapshot.audit_report.version_minor}`,
    },
    project: { name: snapshot.project.name },
    content_item: { content_sub_type: snapshot.content_item.content_sub_type },
    variants: snapshot.variants.map((v) => ({
      id: v.id,
      variant_label: v.variant_label,
      variant_index: v.variant_index,
      // body_html is LLM output (controlled-origin via the firm's variant-
      // generation pipeline) but still untrusted shape — sanitize before
      // it reaches the anonymous public page. Allowlist matches Tiptap's
      // basic-block tag set per _shared/sanitize.ts. When body_html is
      // null (Phase 5 composer only writes it on Tiptap edit) fall back
      // to wrapping body_text in escaped <p> tags so the page renders.
      body_html: v.body_html
        ? sanitizeHtml(v.body_html)
        : plainTextToHtml(v.body_text),
      body_text: v.body_text,
      variation_directive: v.variation_directive,
      char_count: v.char_count,
    })),
    recommended_variant_id: delivery.recommended_variant_id ?? null,
    sender: { from_name: snapshot.sender.from_name },
    expires_at: expiresAt,
  };

  return jsonResponse(200, { data: body, error: null });
});
