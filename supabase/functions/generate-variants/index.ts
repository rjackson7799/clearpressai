/**
 * generate-variants — Edge Function
 *
 * Given a content_item_id (and optional variant_index for per-variant
 * regeneration), loads the content item, project, brand voice profile, and
 * active guidelines; fires 1 or 3 parallel Claude calls; upserts each result
 * via the atomic `regenerate_variant` RPC (H7 audit fix — clears prior
 * compliance_findings + upserts the variant row in one PL/pgSQL transaction).
 *
 * Auth: requires a valid JWT (no --no-verify-jwt).
 *
 * Audit data captured per row in `generation_params`:
 *   - prompt_version, variation_axis, variation_directive, sub_type_input,
 *     sub_type_classified (extracted from the model output marker when
 *     sub_type_input is 'auto'), length_norm_fallback {requested, used},
 *     max_tokens, brief_hash (sha256 of brief fields), triggered_by_user_id,
 *     generated_at, anthropic_input_tokens, anthropic_output_tokens.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  CLAUDE_MODELS,
  VARIANT_GENERATION_PROMPT_VERSION,
  VARIANT_GENERATION_SYSTEM,
  VARIATION_DIRECTIVES,
  buildVariantUserMessage,
  parseSubTypeMarker,
  type ContentSubType,
  type VariationAxis,
} from './_prompt.ts';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonResponse, jsonError } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
  getUserIdFromAuth,
} from '../_shared/auth.ts';

const InputSchema = z.object({
  content_item_id: z.string().uuid(),
  variant_index: z.number().int().min(1).max(3).optional(),
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
  if (!anthropicKey) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'Missing ANTHROPIC_API_KEY',
    });
  }

  let supabase;
  let userId: string;
  try {
    supabase = createSupabaseFromRequest(req);
    userId = await getUserIdFromAuth(supabase);
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError(401, { code: 'permission_denied', message: e.message });
    }
    return jsonError(500, {
      code: 'internal_error',
      message: (e as Error).message,
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
      details: parsed.error.issues,
    });
  }

  const { content_item_id, variant_index } = parsed.data;

  const { data: contentItem, error: contentItemError } = await supabase
    .from('content_items')
    .select(
      'id, project_id, content_type, content_sub_type, brief_free_text, brief_key_messages, brief_quotes, brief_data_points, brief_constraints, variation_axis, language',
    )
    .eq('id', content_item_id)
    .single();

  if (contentItemError || !contentItem) {
    return jsonError(404, {
      code: 'not_found',
      message: `Content item not found: ${contentItemError?.message ?? 'unknown'}`,
    });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, client_id, created_by')
    .eq('id', contentItem.project_id)
    .single();

  if (projectError || !project) {
    return jsonError(404, {
      code: 'not_found',
      message: `Project not found: ${projectError?.message ?? 'unknown'}`,
    });
  }

  const { data: voiceProfile, error: voiceProfileError } = await supabase
    .from('brand_voice_profiles')
    .select(
      'tone_keywords, stylistic_patterns, preferred_vocabulary, words_to_avoid, signature_phrases, length_norms',
    )
    .eq('client_id', project.client_id)
    .single();

  if (voiceProfileError || !voiceProfile) {
    return jsonError(404, {
      code: 'not_found',
      message: `Brand voice profile not found for client: ${voiceProfileError?.message ?? 'unknown'}`,
    });
  }

  // B3 audit fix: filter on `active = true` (the actual column name), not
  // `archived = false`.
  const { data: guidelinesRows, error: guidelinesError } = await supabase
    .from('brand_voice_guidelines')
    .select('guideline_text')
    .eq('client_id', project.client_id)
    .eq('active', true);

  if (guidelinesError) {
    return jsonError(500, {
      code: 'internal_error',
      message: `Guidelines fetch failed: ${guidelinesError.message}`,
    });
  }

  const guidelines = (guidelinesRows ?? []).map((g) => g.guideline_text);

  // D2 length-norm fallback: prefer the requested content_type, then
  // press_release, then any available key, else null.
  const lengthNorms = (voiceProfile.length_norms ??
    {}) as Record<string, string>;
  let lengthNormUsed: string | null;
  if (lengthNorms[contentItem.content_type]) {
    lengthNormUsed = contentItem.content_type;
  } else if (lengthNorms['press_release']) {
    lengthNormUsed = 'press_release';
  } else {
    const keys = Object.keys(lengthNorms);
    lengthNormUsed = keys.length > 0 ? keys[0] : null;
  }
  const lengthNormFallback = {
    requested: contentItem.content_type,
    used: lengthNormUsed,
  };

  // H6 forensics: brief_hash so Phase 4 audit-event backfill can prove
  // which brief the variant was generated against.
  const briefInput = [
    contentItem.brief_free_text ?? '',
    JSON.stringify(contentItem.brief_key_messages ?? []),
    JSON.stringify(contentItem.brief_quotes ?? []),
    JSON.stringify(contentItem.brief_data_points ?? []),
    contentItem.brief_constraints ?? '',
  ].join('\n');
  const briefHash = await sha256Hex(briefInput);

  const indicesToGenerate: (1 | 2 | 3)[] = variant_index
    ? [variant_index as 1 | 2 | 3]
    : [1, 2, 3];
  const variationAxis = contentItem.variation_axis as VariationAxis;
  const subType = contentItem.content_sub_type as ContentSubType;

  const voiceProfileForPrompt = {
    tone_keywords: (voiceProfile.tone_keywords ?? []) as string[],
    stylistic_patterns: (voiceProfile.stylistic_patterns ?? '') as string,
    preferred_vocabulary: (voiceProfile.preferred_vocabulary ??
      []) as string[],
    words_to_avoid: (voiceProfile.words_to_avoid ?? []) as string[],
    signature_phrases: (voiceProfile.signature_phrases ?? []) as string[],
    length_norms: lengthNorms,
  };

  const systemPrompt = VARIANT_GENERATION_SYSTEM({
    voiceProfile: voiceProfileForPrompt,
    guidelines,
    contentType: contentItem.content_type,
    subType,
    language: contentItem.language as 'ja' | 'en',
  });

  const generatedAt = new Date().toISOString();
  const anthropic = new Anthropic({ apiKey: anthropicKey, maxRetries: 6 });

  // Pre-fetch actor name once so the parallel audit writes below don't each
  // round-trip to the users table. Non-critical — null is fine.
  const { data: actorRow } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  const actorNameSnapshot = actorRow?.full_name ?? null;

  const isRegeneration = variant_index !== undefined;

  try {
    const variantPromises = indicesToGenerate.map(async (index) => {
      const directive = VARIATION_DIRECTIVES[variationAxis][index];

      const userMessage = buildVariantUserMessage({
        contentItem: {
          brief_free_text: contentItem.brief_free_text ?? '',
          brief_key_messages: (contentItem.brief_key_messages ??
            []) as string[],
          brief_quotes: (contentItem.brief_quotes ?? []) as {
            name: string;
            title: string;
            quote: string;
          }[],
          brief_data_points: (contentItem.brief_data_points ?? []) as string[],
          brief_constraints: contentItem.brief_constraints ?? null,
        },
        directive,
      });

      const response = await anthropic.messages.create({
        model: CLAUDE_MODELS.variant_generation,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error(`variant ${index}: no text block in response`);
      }

      const { body, sub_type_classified } = parseSubTypeMarker(textBlock.text);
      const charCount = Array.from(body).length;
      const readingTimeSeconds = Math.ceil(charCount / 6);

      const generationParams = {
        prompt_version: VARIANT_GENERATION_PROMPT_VERSION,
        variation_axis: variationAxis,
        variation_directive: directive.directive,
        sub_type_input: subType,
        sub_type_classified,
        length_norm_fallback: lengthNormFallback,
        max_tokens: 4096,
        brief_hash: briefHash,
        triggered_by_user_id: userId,
        generated_at: generatedAt,
        anthropic_input_tokens: response.usage.input_tokens,
        anthropic_output_tokens: response.usage.output_tokens,
      };

      // Phase 7: I4 atomicity. regenerate_variant now emits the
      // variant_generated audit event inside the same tx as the variant
      // upsert. The Edge Function passes audit details + actor context
      // as RPC params; no follow-up insert.
      const auditDetails = {
        content_item_id: content_item_id,
        variant_index: index,
        is_regeneration: isRegeneration,
        brief_hash: briefHash,
        sub_type_classified,
        length_norm_fallback: lengthNormFallback,
        anthropic_input_tokens: response.usage.input_tokens,
        anthropic_output_tokens: response.usage.output_tokens,
      };

      const { data: variant, error: rpcError } = await supabase.rpc(
        'regenerate_variant',
        {
          p_content_item_id: content_item_id,
          p_variant_index: index,
          p_variant_label: directive.label,
          p_body_text: body,
          p_char_count: charCount,
          p_reading_time_seconds: readingTimeSeconds,
          p_model_used: response.model,
          p_generation_params: generationParams,
          p_project_id: project.id,
          p_actor_id: userId,
          p_actor_name_snapshot: actorNameSnapshot,
          p_audit_details: auditDetails,
        },
      );

      if (rpcError) {
        throw new Error(`variant ${index} RPC failed: ${rpcError.message}`);
      }

      return variant;
    });

    const variants = await Promise.all(variantPromises);

    return jsonResponse(200, {
      data: { variants },
      error: null,
    });
  } catch (e) {
    return jsonError(502, {
      code: 'ai_error',
      message: `Generation failed: ${(e as Error).message}`,
    });
  }
});
