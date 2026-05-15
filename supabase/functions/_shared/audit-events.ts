import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side audit-trail writer. Used by Edge Functions to emit the
 * system-originated events Phase 4 owns: `variant_generated`,
 * `compliance_checked`, `compliance_rechecked`. All other event types are
 * emitted by PL/pgSQL RPCs in migration 0005, NOT by this helper.
 *
 * I1 (integrity model): browser code never inserts into audit_trail_events.
 * The grep guard in T11 enforces that this module's caller path stays inside
 * `supabase/functions/`.
 *
 * Atomicity caveat: an Edge Function writes the domain row (via the
 * `regenerate_variant` RPC, or direct table writes in compliance-check) and
 * then calls recordAuditEvent. If the audit insert fails, the upstream
 * domain write has already committed. The caller throws and the next retry
 * inserts a fresh row, so the trail may grow duplicate events for one
 * variant on retry. Live events have no idempotence guard (the partial
 * index from 0005 only covers backfilled rows with `details.source_table`).
 * Acceptable trade-off for v1; a v2 refactor can move the audit insert
 * INTO the RPC for true atomicity.
 */

/**
 * `feedback_received` and `voice_updated` are emitted from PL/pgSQL RPCs
 * (`submit_feedback`, `append_voice_guidelines_from_feedback`) in migration
 * 0009, not via `recordAuditEvent`. The enum is widened here so any future
 * Edge Function caller — and any audit-trail consumer importing this type —
 * stays type-safe across the full Phase 6 event surface.
 */
export type ServerAuditEventType =
  | 'variant_generated'
  | 'compliance_checked'
  | 'compliance_rechecked'
  | 'feedback_received'
  | 'voice_updated';

export interface RecordAuditEventInput {
  projectId: string;
  eventType: ServerAuditEventType;
  details: Record<string, unknown>;
  actorId?: string | null;
  /**
   * If provided (even as `null`), skips the users-table lookup. Pass when
   * the caller already has the user's full_name in scope to avoid a
   * per-event round-trip.
   */
  actorNameSnapshot?: string | null;
  modelUsed?: string | null;
  auditReportId?: string | null;
}

export class AuditEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditEventError';
  }
}

export async function recordAuditEvent(
  supabase: SupabaseClient,
  input: RecordAuditEventInput,
): Promise<void> {
  const actorType: 'user' | 'system' = input.actorId ? 'user' : 'system';

  let actorName: string | null = null;
  if (input.actorId) {
    if (input.actorNameSnapshot !== undefined) {
      actorName = input.actorNameSnapshot;
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', input.actorId)
        .maybeSingle();
      if (error) {
        throw new AuditEventError(
          `Actor name lookup failed for ${input.actorId}: ${error.message}`,
        );
      }
      actorName = data?.full_name ?? null;
    }
  }

  const { error } = await supabase.from('audit_trail_events').insert({
    project_id: input.projectId,
    audit_report_id: input.auditReportId ?? null,
    event_type: input.eventType,
    actor_type: actorType,
    actor_id: input.actorId ?? null,
    actor_name_snapshot: actorName,
    details: input.details,
    model_used: input.modelUsed ?? null,
  });

  if (error) {
    throw new AuditEventError(
      `Audit event '${input.eventType}' insert failed: ${error.message}`,
    );
  }
}
