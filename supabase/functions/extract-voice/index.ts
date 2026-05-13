/**
 * extract-voice — Edge Function
 *
 * Loads N brand voice samples, calls Claude with the Phase 0 validated
 * extraction prompt, validates the JSON output, and upserts a
 * `brand_voice_profiles` row + seeds one `brand_voice_guidelines` row.
 *
 * Auth: uses the caller's JWT. All DB writes inherit `firm_users_full_access`
 * RLS — no service role.
 *
 * Audit: persists `extraction_run_id`, `prompt_version`, `model_used`,
 * `last_extracted_at`, and resets `user_edited = false` on every run.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  BRAND_VOICE_EXTRACTION_SYSTEM,
  BrandVoiceProfileSchema,
  CLAUDE_MODELS,
  EXTRACTION_PROMPT_VERSION,
  buildExtractionUserMessage,
} from './_prompt.ts';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonResponse, jsonError } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
  requireAuthorization,
} from '../_shared/auth.ts';

const MIN_SAMPLE_CHARS = 500;
const MAX_TOTAL_INPUT_CHARS = 180_000;

const InputSchema = z.object({
  client_id: z.string().uuid(),
  sample_ids: z.array(z.string().uuid()).min(5).max(20),
});

Deno.serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return jsonError(405, {
      code: 'validation_error',
      message: 'Method not allowed',
    });
  }

  try {
    requireAuthorization(req);
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError(401, { code: 'permission_denied', message: e.message });
    }
    throw e;
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'Missing ANTHROPIC_API_KEY',
    });
  }

  let supabase;
  try {
    supabase = createSupabaseFromRequest(req);
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

  const { client_id } = parsed.data;
  const dedupedSampleIds = Array.from(new Set(parsed.data.sample_ids));
  if (dedupedSampleIds.length < 5) {
    return jsonError(400, {
      code: 'validation_error',
      message: 'At least 5 distinct sample ids required after dedupe',
    });
  }

  const { data: samples, error: samplesError } = await supabase
    .from('brand_voice_samples')
    .select('id, content_text, filename')
    .in('id', dedupedSampleIds)
    .eq('client_id', client_id);

  if (samplesError) {
    return jsonError(500, {
      code: 'internal_error',
      message: `Sample fetch failed: ${samplesError.message}`,
    });
  }

  if (!samples || samples.length !== dedupedSampleIds.length) {
    return jsonError(404, {
      code: 'not_found',
      message: 'Some samples not found or not owned by client',
    });
  }

  const lowText = samples.filter(
    (s) => !s.content_text || s.content_text.length < MIN_SAMPLE_CHARS,
  );
  if (lowText.length > 0) {
    return jsonError(400, {
      code: 'validation_error',
      message: `${lowText.length} sample(s) have less than ${MIN_SAMPLE_CHARS} chars of extracted text`,
      details: { sample_ids: lowText.map((s) => s.id) },
    });
  }

  const totalChars = samples.reduce(
    (sum, s) => sum + (s.content_text?.length ?? 0),
    0,
  );
  if (totalChars > MAX_TOTAL_INPUT_CHARS) {
    return jsonError(400, {
      code: 'validation_error',
      message: `Total input ${totalChars} chars exceeds ${MAX_TOTAL_INPUT_CHARS} char budget`,
    });
  }

  const sampleTexts = samples.map((s) => s.content_text as string);
  const userMessage = buildExtractionUserMessage(sampleTexts);

  const anthropic = new Anthropic({ apiKey: anthropicKey, maxRetries: 6 });

  let response;
  try {
    response = await anthropic.messages.create({
      model: CLAUDE_MODELS.brand_voice_extraction,
      max_tokens: 4096,
      system: BRAND_VOICE_EXTRACTION_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (e) {
    return jsonError(502, {
      code: 'ai_error',
      message: `Anthropic API error: ${(e as Error).message}`,
    });
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return jsonError(502, {
      code: 'ai_error',
      message: 'Anthropic response contained no text block',
    });
  }

  const fenceStripped = textBlock.text.replace(
    /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/,
    '$1',
  );

  let profileJson: unknown;
  try {
    profileJson = JSON.parse(fenceStripped);
  } catch (e) {
    return jsonError(502, {
      code: 'ai_error',
      message: `JSON parse failed: ${(e as Error).message}`,
      details: { raw: textBlock.text },
    });
  }

  const profileResult = BrandVoiceProfileSchema.safeParse(profileJson);
  if (!profileResult.success) {
    return jsonError(502, {
      code: 'ai_error',
      message: 'AI output did not match schema',
      details: { issues: profileResult.error.issues, raw: textBlock.text },
    });
  }
  const profile = profileResult.data;

  const extractionRunId = crypto.randomUUID();
  const modelUsed = response.model;
  const now = new Date().toISOString();

  const { data: upserted, error: upsertError } = await supabase
    .from('brand_voice_profiles')
    .upsert(
      {
        client_id,
        tone_keywords: profile.tone_keywords,
        stylistic_patterns: profile.stylistic_patterns,
        preferred_vocabulary: profile.preferred_vocabulary,
        words_to_avoid: profile.words_to_avoid,
        signature_phrases: profile.signature_phrases,
        length_norms: profile.length_norms,
        extraction_run_id: extractionRunId,
        prompt_version: EXTRACTION_PROMPT_VERSION,
        model_used: modelUsed,
        last_extracted_at: now,
        user_edited: false,
        updated_at: now,
      },
      { onConflict: 'client_id' },
    )
    .select()
    .single();

  if (upsertError || !upserted) {
    return jsonError(500, {
      code: 'internal_error',
      message: `Profile upsert failed: ${upsertError?.message ?? 'unknown'}`,
    });
  }

  const guidelineText = [
    profile.stylistic_patterns.slice(0, 280),
    '',
    'Tone:',
    ...profile.tone_keywords.map((k) => `- ${k}`),
  ].join('\n');

  const { data: guideline, error: guidelineError } = await supabase
    .from('brand_voice_guidelines')
    .insert({
      client_id,
      source_type: 'extraction',
      source_reference_id: extractionRunId,
      guideline_text: guidelineText,
      active: true,
    })
    .select('id')
    .single();

  if (guidelineError) {
    return jsonError(500, {
      code: 'internal_error',
      message: `Guideline insert failed: ${guidelineError.message}`,
    });
  }

  return jsonResponse(200, {
    data: {
      profile: upserted,
      guideline_id: guideline?.id ?? null,
      extraction_run_id: extractionRunId,
      model_used: modelUsed,
      prompt_version: EXTRACTION_PROMPT_VERSION,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    },
    error: null,
  });
});
