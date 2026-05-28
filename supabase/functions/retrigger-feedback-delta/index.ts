/**
 * retrigger-feedback-delta — Edge Function (JWT-gated, firm-side)
 *
 * Phase 7 polish: manual retry for client_feedback rows where the inline
 * Haiku guideline-delta call from feedback-submit failed. The partial
 * index `idx_client_feedback_delta_failed` (migration 0009) backs the
 * firm-side list query that surfaces these rows; this function does the
 * actual retry.
 *
 * Auth: firm-side authenticated user (JWT required). The two underlying
 * RPCs (append_voice_guidelines_from_feedback / record_feedback_delta_failure)
 * are service-role-only, so the function escalates to a service-role
 * client internally. The authenticated user is established only for log
 * attribution; no per-firm authorization is layered on top in v1 (single-
 * tenant by deployment).
 *
 * Input: { feedback_id: uuid }
 * Output (HTTP 200):
 *   { data: { delta_status: 'succeeded' | 'failed' }, error: null }
 * Errors:
 *   404 feedback_not_found
 *   409 not_in_failed_state — guard so a retry against a 'succeeded' or
 *     'pending' row doesn't overwrite legitimate state. Only 'failed' rows
 *     are retryable from this endpoint.
 *
 * On LLM success: calls append_voice_guidelines_from_feedback (flips status
 * to 'succeeded', emits voice_updated audit event). On failure: calls
 * record_feedback_delta_failure (updates delta_error). Same shape as
 * feedback-submit's first-write path; the difference is the entry point
 * (feedback_id vs token) and the prerequisite (delta_generation_status
 * MUST be 'failed').
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
  getUserIdFromAuth,
} from '../_shared/auth.ts';
import type { DeliverySnapshot } from '../_shared/types-delivery.ts';
import {
  CLAUDE_MODELS,
  VOICE_GUIDELINE_DELTA_SYSTEM,
  VoiceGuidelineDeltaResponseSchema,
  buildGuidelineDeltaUserMessage,
} from '../_shared/guideline-delta-prompt.ts';

const InputSchema = z.object({
  feedback_id: z.string().uuid(),
});

interface FeedbackContextRow {
  id: string;
  chosen_variant_id: string | null;
  needs_rework: boolean;
  what_worked: unknown;
  what_could_improve: unknown;
  free_text_comment: string | null;
  delta_generation_status: 'pending' | 'succeeded' | 'failed';
  feedback_token: {
    id: string;
    delivery: {
      id: string;
      delivery_snapshot: DeliverySnapshot;
    };
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
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

  // Authenticate the firm-side caller (JWT). The service-role client is
  // used for the RPCs themselves (REVOKE'd from authenticated in 0009);
  // the JWT establishes that this is a logged-in firm user, not anonymous.
  try {
    const authSupabase = createSupabaseFromRequest(req);
    await getUserIdFromAuth(authSupabase);
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError(401, {
        code: 'permission_denied',
        message: e.message,
      });
    }
    throw e;
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
      details: parsed.error.flatten(),
    });
  }
  const { feedback_id } = parsed.data;

  const supabase = createClient(url, serviceKey);

  // Load feedback row + linked delivery_snapshot (needed for variant bodies).
  // Embed via feedback_token -> delivery; client_feedback has no direct
  // delivery_id FK (chain runs through feedback_tokens).
  const { data: rowRaw, error: rowErr } = await supabase
    .from('client_feedback')
    .select(
      `
        id, chosen_variant_id, needs_rework, what_worked, what_could_improve,
        free_text_comment, delta_generation_status,
        feedback_token:feedback_tokens!inner(
          id,
          delivery:deliveries!inner(id, delivery_snapshot)
        )
      `,
    )
    .eq('id', feedback_id)
    .maybeSingle();

  if (rowErr) {
    return jsonError(500, {
      code: 'internal_error',
      message: `client_feedback lookup failed: ${rowErr.message}`,
    });
  }
  if (!rowRaw) {
    return jsonError(404, {
      code: 'not_found',
      message: 'feedback_not_found',
    });
  }
  const row = rowRaw as unknown as FeedbackContextRow;

  if (row.delta_generation_status !== 'failed') {
    return jsonError(409, {
      code: 'validation_error',
      message: 'not_in_failed_state',
    });
  }

  // Build the same user message the original feedback-submit call would
  // have produced — chosen variant body (or null on Needs Rework), other
  // variant bodies, chips, free text. delivery_snapshot.variants is the
  // source for body_text; the bodies in the snapshot are immutable, so
  // the retry sees exactly the content the client saw.
  const snapshot = row.feedback_token.delivery.delivery_snapshot;
  const variants = snapshot.variants;
  const chosen =
    row.chosen_variant_id !== null
      ? variants.find((v) => v.id === row.chosen_variant_id) ?? null
      : null;
  const others = variants.filter((v) => v.id !== row.chosen_variant_id);

  const userMessage = buildGuidelineDeltaUserMessage({
    chosen_variant: chosen
      ? { variant_label: chosen.variant_label, body_text: chosen.body_text }
      : null,
    other_variants: others.map((v) => ({
      variant_label: v.variant_label,
      body_text: v.body_text,
    })),
    what_worked: toStringArray(row.what_worked),
    what_could_improve: toStringArray(row.what_could_improve),
    free_text_comment: row.free_text_comment,
    needs_rework: row.needs_rework,
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
      { p_feedback_id: feedback_id, p_guidelines: guidelines },
    );
    if (appendErr) {
      throw new Error(`append_voice_guidelines RPC failed: ${appendErr.message}`);
    }
    deltaStatus = 'succeeded';
  } catch (e) {
    const errMsg = (e as Error).message || String(e);
    console.warn(
      JSON.stringify({
        event: 'retrigger_feedback_delta_failed',
        feedback_id,
        error: errMsg.slice(0, 500),
      }),
    );
    const { error: failErr } = await supabase.rpc(
      'record_feedback_delta_failure',
      { p_feedback_id: feedback_id, p_error: errMsg },
    );
    if (failErr) {
      console.error(
        JSON.stringify({
          event: 'record_feedback_delta_failure_failed',
          feedback_id,
          error: failErr.message,
        }),
      );
    }
    deltaStatus = 'failed';
  }

  return jsonResponse(200, {
    data: { delta_status: deltaStatus },
    error: null,
  });
});
