/**
 * compliance-check — Edge Function
 *
 * For each variant_id (1–3): runs a deterministic regex pass over forbidden
 * absolute terms + client words_to_avoid + required boilerplate + (when
 * applicable) clinical-reference patterns; runs an LLM compliance pass with
 * the TSD §6.3 prompt; merges both finding sets; clears prior
 * compliance_findings for the variant; inserts the merged findings.
 *
 * Each finding's `regulation_reference` is suffixed `[deterministic]` or
 * `[LLM]` so the audit trail (Phase 4) can distinguish source.
 *
 * Auth: requires a valid JWT.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  CLAUDE_MODELS,
  COMPLIANCE_PROMPT_VERSION,
  COMPLIANCE_SYSTEM,
  ComplianceResponseSchema,
  buildComplianceUserMessage,
  runDeterministicChecks,
  type ComplianceFinding,
  type DeterministicFinding,
} from './_prompt.ts';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonResponse, jsonError } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
} from '../_shared/auth.ts';
import { recordAuditEvent } from '../_shared/audit-events.ts';

const InputSchema = z.object({
  variant_ids: z.array(z.string().uuid()).min(1).max(3),
});

interface VariantContext {
  variantId: string;
  bodyText: string;
  contentType: string;
  contentSubType: string;
  wordsToAvoid: string[];
}

interface MergedFinding extends ComplianceFinding {
  source: 'deterministic' | 'LLM';
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

  const variantIds = Array.from(new Set(parsed.data.variant_ids));

  const anthropic = new Anthropic({ apiKey: anthropicKey, maxRetries: 6 });

  try {
    const variantResults = await Promise.all(
      variantIds.map(async (variantId): Promise<{ variantId: string; findings: ComplianceFinding[] }> => {
        // Load variant + content_item (for content_type + sub_type) + project
        // (for client_id) in a single nested PostgREST select.
        const { data: variantRow, error: variantError } = await supabase
          .from('content_variants')
          .select(
            'id, body_text, content_items!inner(project_id, content_type, content_sub_type, projects!inner(client_id))',
          )
          .eq('id', variantId)
          .single();

        if (variantError || !variantRow) {
          throw new Error(
            `Variant ${variantId} not found: ${variantError?.message ?? 'unknown'}`,
          );
        }

        const contentItem = variantRow.content_items as unknown as {
          project_id: string;
          content_type: string;
          content_sub_type: string;
          projects: { client_id: string };
        };
        const clientId = contentItem.projects.client_id;
        const projectId = contentItem.project_id;

        const { data: voiceProfile, error: voiceProfileError } = await supabase
          .from('brand_voice_profiles')
          .select('words_to_avoid')
          .eq('client_id', clientId)
          .single();

        if (voiceProfileError) {
          throw new Error(
            `Voice profile fetch failed for client ${clientId}: ${voiceProfileError.message}`,
          );
        }

        const wordsToAvoid = (voiceProfile?.words_to_avoid ??
          []) as string[];

        const ctx: VariantContext = {
          variantId,
          bodyText: variantRow.body_text,
          contentType: contentItem.content_type,
          contentSubType: contentItem.content_sub_type,
          wordsToAvoid,
        };

        // 1. Deterministic pass (D9 + H5).
        const requireClinicalReference =
          ctx.contentSubType === 'full_clinical';
        const deterministicFindings: DeterministicFinding[] =
          runDeterministicChecks(ctx.bodyText, ctx.wordsToAvoid, {
            requireClinicalReference,
          });

        // 2. LLM pass.
        const llmResponse = await anthropic.messages.create({
          model: CLAUDE_MODELS.compliance_check,
          max_tokens: 4096,
          system: COMPLIANCE_SYSTEM,
          messages: [
            {
              role: 'user',
              content: buildComplianceUserMessage(ctx.bodyText),
            },
          ],
        });

        const textBlock = llmResponse.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error(
            `LLM compliance for variant ${variantId}: no text block`,
          );
        }

        const fenceStripped = textBlock.text.replace(
          /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/,
          '$1',
        );

        let llmJson: unknown;
        try {
          llmJson = JSON.parse(fenceStripped);
        } catch (e) {
          throw new Error(
            `LLM JSON parse failed for variant ${variantId}: ${(e as Error).message}`,
            { cause: e },
          );
        }

        const llmParsed = ComplianceResponseSchema.safeParse(llmJson);
        if (!llmParsed.success) {
          throw new Error(
            `LLM output did not match schema for variant ${variantId}: ${llmParsed.error.message}`,
          );
        }

        const llmFindingsTagged: ComplianceFinding[] = llmParsed.data.findings.map(
          (f) => ({
            ...f,
            regulation_reference: `${f.regulation_reference} [LLM]`,
          }),
        );

        // 3. Merge (no dedupe — side panel surfaces both sources).
        const merged: MergedFinding[] = [
          ...deterministicFindings.map((f) => ({
            ...f,
            source: 'deterministic' as const,
          })),
          ...llmFindingsTagged.map((f) => ({
            ...f,
            source: 'LLM' as const,
          })),
        ];

        // 4. Delete prior findings for this variant + insert merged set.
        // Capturing the cleared-row count via .select('id') lets us tell a
        // recheck from a first check for the T4 audit event below.
        const { data: clearedRows, error: deleteError } = await supabase
          .from('compliance_findings')
          .delete()
          .eq('variant_id', variantId)
          .select('id');

        if (deleteError) {
          throw new Error(
            `Delete prior findings failed for ${variantId}: ${deleteError.message}`,
          );
        }

        const priorFindingsCount = clearedRows?.length ?? 0;

        const rowsToInsert = merged.map((f) => ({
          variant_id: variantId,
          severity: f.severity,
          source_text: f.source_text,
          paragraph_index: f.paragraph_index,
          explanation: f.explanation,
          regulation_reference: f.regulation_reference,
          suggested_correction: f.suggested_correction,
          resolution_status: 'unresolved' as const,
        }));

        let insertedRows: ComplianceFinding[] = [];
        if (rowsToInsert.length > 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('compliance_findings')
            .insert(rowsToInsert)
            .select(
              'severity, source_text, paragraph_index, explanation, regulation_reference, suggested_correction',
            );

          if (insertError) {
            throw new Error(
              `Insert findings failed for ${variantId}: ${insertError.message}`,
            );
          }
          insertedRows = (inserted ?? []) as ComplianceFinding[];
        }

        // T4: live audit event. compliance_rechecked when prior findings
        // were cleared, compliance_checked when this is the first run.
        // Counts come from the deterministic / LLM sources (pre-merge)
        // so they stay accurate even when the merged set is empty.
        await recordAuditEvent(supabase, {
          projectId,
          eventType:
            priorFindingsCount > 0 ? 'compliance_rechecked' : 'compliance_checked',
          modelUsed: llmResponse.model,
          details: {
            variant_id: variantId,
            deterministic_finding_count: deterministicFindings.length,
            llm_finding_count: llmFindingsTagged.length,
            total_finding_count: merged.length,
            prior_findings_cleared: priorFindingsCount,
          },
        });

        return {
          variantId,
          findings: insertedRows,
        };
      }),
    );

    const findingsByVariant: Record<string, ComplianceFinding[]> = {};
    for (const r of variantResults) {
      findingsByVariant[r.variantId] = r.findings;
    }

    return jsonResponse(200, {
      data: {
        findings_by_variant: findingsByVariant,
        prompt_version: COMPLIANCE_PROMPT_VERSION,
      },
      error: null,
    });
  } catch (e) {
    return jsonError(502, {
      code: 'ai_error',
      message: `Compliance check failed: ${(e as Error).message}`,
    });
  }
});
