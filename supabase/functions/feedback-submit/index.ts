/**
 * feedback-submit — Edge Function (--no-verify-jwt, anonymous)
 *
 * Phase 6 T4. Accepts a feedback submission from the public magic-link page,
 * persists it through the `submit_feedback` PL/pgSQL RPC (migration 0009),
 * then distills the feedback into 1-3 voice guidelines via Claude Haiku and
 * appends them via the `append_voice_guidelines_from_feedback` RPC.
 *
 * Trust model:
 *   - Caller is anonymous. Auth is by holding the 43-char URL-safe-base64
 *     token. Service-role client is used internally.
 *   - Externally, all submit-time failures collapse to opaque token_invalid
 *     (404) to prevent token-namespace probing. Granular reason lives in
 *     server logs only.
 *
 * Idempotent against lost-response retries:
 *   - The RPC handles the `used_at IS NOT NULL` case by returning
 *     `already_submitted: true` + the existing feedback row + delivery_snapshot.
 *   - This function relays that as `{status: 'already_submitted',
 *     delta_status: 'skipped'}` and SKIPS the LLM step (no duplicate guidelines).
 *
 * LLM failure path:
 *   - The feedback row stays valid. delta_generation_status is set to
 *     'failed' via the `record_feedback_delta_failure` RPC. The firm-side
 *     feedback tab surfaces the failed-delta flag (T7). A v2 carry-forward
 *     adds a manual re-trigger button.
 *
 * Response shape (200 on submit success OR idempotent replay):
 *   { data: { ok: true, status: 'submitted'|'already_submitted',
 *             delta_status: 'succeeded'|'failed'|'skipped' }, error: null }
 *
 * Anti-duplication context (NOT included in v1):
 *   The plan called for loading existing active brand_voice_guidelines into
 *   the user message to anti-duplicate. Deferred to v2 polish — the duplicate
 *   risk is acceptable for single-client beta and the guideline pool can be
 *   manually pruned via the firm UI in the meantime.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import { isValidTokenFormat } from '../_shared/magic-link.ts';
import { FeedbackSubmitInputSchema } from '../_shared/types-feedback.ts';
import type { FeedbackSubmitResponse } from '../_shared/types-feedback.ts';
import type { DeliverySnapshot } from '../_shared/types-delivery.ts';
import {
  CLAUDE_MODELS,
  VOICE_GUIDELINE_DELTA_SYSTEM,
  VoiceGuidelineDeltaResponseSchema,
  buildGuidelineDeltaUserMessage,
} from '../_shared/guideline-delta-prompt.ts';

type InvalidReason =
  | 'token_format_mismatch'
  | 'token_format_invalid'
  | 'token_not_found'
  | 'token_expired'
  | 'chosen_variant_xor_rework_required'
  | 'chosen_variant_invalid'
  | 'submit_rpc_other_error';

function logInvalid(reason: InvalidReason, token: string): void {
  console.warn(
    JSON.stringify({
      event: 'feedback_submit_invalid',
      reason,
      token_prefix: token.slice(0, 4),
    }),
  );
}

function opaqueInvalid(reason: InvalidReason, token: string): Response {
  logInvalid(reason, token);
  return jsonError(404, { code: 'not_found', message: 'token_invalid' });
}

interface SubmitRpcResult {
  feedback_id: string;
  project_id: string;
  client_id: string;
  delivery_id: string;
  delivery_snapshot: DeliverySnapshot;
  already_submitted: boolean;
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

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!anthropicKey || !url || !serviceKey) {
    return jsonError(500, {
      code: 'internal_error',
      message:
        'Missing ANTHROPIC_API_KEY or SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
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

  const parsed = FeedbackSubmitInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      code: 'validation_error',
      message: 'Invalid input',
      details: parsed.error.flatten(),
    });
  }
  const input = parsed.data;

  if (!isValidTokenFormat(input.token)) {
    return opaqueInvalid('token_format_mismatch', input.token);
  }

  // Mirror the DB XOR invariant client-of-RPC side so a malformed payload
  // never reaches the RPC. The RPC also enforces this — belt + suspenders.
  const chosenIsSet = input.chosen_variant_id !== null;
  if (chosenIsSet === input.needs_rework) {
    return opaqueInvalid('chosen_variant_xor_rework_required', input.token);
  }

  const supabase = createClient(url, serviceKey);

  const { data: rpcDataRaw, error: rpcErr } = await supabase.rpc(
    'submit_feedback',
    {
      p_token: input.token,
      p_payload: {
        chosen_variant_id: input.chosen_variant_id,
        what_worked: input.what_worked,
        what_could_improve: input.what_could_improve,
        needs_rework: input.needs_rework,
        free_text_comment: input.free_text_comment,
      },
    },
  );

  if (rpcErr) {
    // P0004 gates carry semantic codes in error.message
    const code = (rpcErr as { code?: string }).code;
    const message = rpcErr.message ?? '';
    if (code === 'P0004') {
      const gateReason: InvalidReason =
        message === 'token_format_invalid'
          ? 'token_format_invalid'
          : message === 'token_not_found'
            ? 'token_not_found'
            : message === 'token_expired'
              ? 'token_expired'
              : message === 'chosen_variant_xor_rework_required'
                ? 'chosen_variant_xor_rework_required'
                : message === 'chosen_variant_invalid'
                  ? 'chosen_variant_invalid'
                  : 'submit_rpc_other_error';
      return opaqueInvalid(gateReason, input.token);
    }
    return jsonError(500, {
      code: 'internal_error',
      message: `submit_feedback failed: ${message}`,
    });
  }

  const rpcResult = rpcDataRaw as SubmitRpcResult | null;
  if (!rpcResult) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'submit_feedback returned no row',
    });
  }

  // Idempotent-replay path: row already exists, skip LLM step.
  if (rpcResult.already_submitted) {
    const body: FeedbackSubmitResponse = {
      ok: true,
      status: 'already_submitted',
      delta_status: 'skipped',
    };
    return jsonResponse(200, { data: body, error: null });
  }

  // First-write path: run the Haiku guideline-delta extraction.
  // On any failure (Anthropic 4xx/5xx, parse error, schema mismatch) we
  // persist the failure via record_feedback_delta_failure and still return
  // a 200 to the caller. The feedback row stays valid.
  const snapshot = rpcResult.delivery_snapshot;
  const variants = snapshot.variants;
  const chosen =
    input.chosen_variant_id !== null
      ? variants.find((v) => v.id === input.chosen_variant_id) ?? null
      : null;
  const others = variants.filter((v) => v.id !== input.chosen_variant_id);

  const userMessage = buildGuidelineDeltaUserMessage({
    chosen_variant: chosen
      ? { variant_label: chosen.variant_label, body_text: chosen.body_text }
      : null,
    other_variants: others.map((v) => ({
      variant_label: v.variant_label,
      body_text: v.body_text,
    })),
    what_worked: input.what_worked,
    what_could_improve: input.what_could_improve,
    free_text_comment: input.free_text_comment,
    needs_rework: input.needs_rework,
  });

  let deltaStatus: 'succeeded' | 'failed';
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey, maxRetries: 3 });
    const response = await anthropic.messages.create({
      model: CLAUDE_MODELS.guideline_delta,
      max_tokens: 1024,
      system: VOICE_GUIDELINE_DELTA_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic response contained no text block');
    }

    const fenceStripped = textBlock.text.replace(
      /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/,
      '$1',
    );
    const guidelinesJson: unknown = JSON.parse(fenceStripped);
    const guidelines = VoiceGuidelineDeltaResponseSchema.parse(guidelinesJson);

    const { error: appendErr } = await supabase.rpc(
      'append_voice_guidelines_from_feedback',
      { p_feedback_id: rpcResult.feedback_id, p_guidelines: guidelines },
    );
    if (appendErr) {
      throw new Error(`append_voice_guidelines RPC failed: ${appendErr.message}`);
    }
    deltaStatus = 'succeeded';
  } catch (e) {
    const errMsg = (e as Error).message || String(e);
    console.warn(
      JSON.stringify({
        event: 'feedback_delta_failed',
        feedback_id: rpcResult.feedback_id,
        error: errMsg.slice(0, 500),
      }),
    );
    const { error: failErr } = await supabase.rpc(
      'record_feedback_delta_failure',
      { p_feedback_id: rpcResult.feedback_id, p_error: errMsg },
    );
    if (failErr) {
      console.error(
        JSON.stringify({
          event: 'record_feedback_delta_failure_failed',
          feedback_id: rpcResult.feedback_id,
          error: failErr.message,
        }),
      );
    }
    deltaStatus = 'failed';
  }

  const body: FeedbackSubmitResponse = {
    ok: true,
    status: 'submitted',
    delta_status: deltaStatus,
  };
  return jsonResponse(200, { data: body, error: null });
});
