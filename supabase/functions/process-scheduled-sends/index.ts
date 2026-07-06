/**
 * process-scheduled-sends — Edge Function (service-role JWT)
 *
 * pg_cron POSTs every minute with Authorization: Bearer <service_role_key>
 * (sourced from Postgres Vault). This function:
 *
 *   1. Verifies the Bearer matches SUPABASE_SERVICE_ROLE_KEY (defense in
 *      depth on top of the platform's JWT gate).
 *   2. Claims up to BATCH_SIZE due rows from scheduled_sends:
 *        processed=false AND attempts < MAX_ATTEMPTS AND scheduled_for <= now()
 *      No FOR UPDATE SKIP LOCKED in v1 — Resend Idempotency-Key dedupes any
 *      overlapping ticks. Carry-forward to v2: explicit leasing pattern.
 *   3. For each row, renders ONLY from delivery_snapshot (no joins back to
 *      mutable content_variants — eliminates the schedule-then-edit drift
 *      hole the reviewer flagged).
 *   4. Attachment failure → record_scheduled_attempt_failure (transient).
 *      If attempts_after >= 3, follows with mark_delivery_failed (terminal).
 *   5. Resend success → mark_delivery_sent_system (audit event in same tx,
 *      actor_type='system').
 *   6. Resend 409 (idempotency collision; same key, different body) →
 *      mark_delivery_failed. It's a code bug, not a transient.
 *   7. Any other Resend failure → record_scheduled_attempt_failure;
 *      if >=3, mark_delivery_failed.
 *
 * Concurrency cap of CONCURRENCY per tick: ~5 sends × pdfshift 2-5s ≈ within
 * one cron minute.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import { ResendError, sendEmail } from '../_shared/resend.ts';
import {
  type Attachment,
  AttachmentError,
  assertTotalSize,
  generateDocx,
  generatePdf,
} from '../_shared/attachments.ts';
import { buildDocMeta, buildPdfHtml } from '../_shared/doc-rendering.ts';
import { applyFeedbackToBody } from '../_shared/delivery-template.ts';
import { buildFeedbackUrl } from '../_shared/magic-link.ts';
import type { DeliverySnapshot } from '../_shared/types-delivery.ts';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;
const CONCURRENCY = 5;

type Outcome =
  | { kind: 'sent'; delivery_id: string; resend_message_id: string }
  | { kind: 'transient_failure'; delivery_id: string; attempts_after: number; error: string }
  | { kind: 'terminal_failure'; delivery_id: string; error: string };

interface DueRow {
  id: string;
  delivery_id: string;
  scheduled_for: string;
  attempts: number;
}

interface DeliveryRow {
  id: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  attachment_format: 'pdf' | 'word' | 'both';
  delivery_snapshot: DeliverySnapshot;
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

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const base = Deno.env.get('PUBLIC_FEEDBACK_URL_BASE');
  if (!url || !serviceKey) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
  }
  if (!base) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'PUBLIC_FEEDBACK_URL_BASE not set',
    });
  }

  // Defense in depth: in addition to the platform JWT gate, verify the
  // Bearer matches service_role_key. pg_cron reads this from Vault.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${serviceKey}`) {
    return jsonError(403, {
      code: 'permission_denied',
      message: 'service role required',
    });
  }

  const supabase = createClient(url, serviceKey);

  // 1. Claim due rows
  const { data: dueRows, error: dueError } = await supabase
    .from('scheduled_sends')
    .select('id, delivery_id, scheduled_for, attempts')
    .eq('processed', false)
    .lt('attempts', MAX_ATTEMPTS)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);
  if (dueError) {
    return jsonError(500, {
      code: 'internal_error',
      message: `scheduled_sends query failed: ${dueError.message}`,
    });
  }
  if (!dueRows || dueRows.length === 0) {
    return jsonResponse(200, {
      data: { processed: 0, summary: {} },
      error: null,
    });
  }

  // 2. Load corresponding delivery rows + tokens
  const deliveryIds = dueRows.map((r) => r.delivery_id);
  const [{ data: deliveryRows, error: dErr }, { data: tokenRows, error: tErr }] =
    await Promise.all([
      supabase
        .from('deliveries')
        .select(
          'id, subject, body_html, body_text, attachment_format, delivery_snapshot',
        )
        .in('id', deliveryIds),
      supabase
        .from('feedback_tokens')
        .select('delivery_id, token')
        .in('delivery_id', deliveryIds),
    ]);
  if (dErr || tErr) {
    return jsonError(500, {
      code: 'internal_error',
      message:
        `lookup failed: deliveries=${dErr?.message ?? 'ok'} tokens=${tErr?.message ?? 'ok'}`,
    });
  }
  const deliveryById = new Map<string, DeliveryRow>(
    (deliveryRows ?? []).map((d) => [d.id, d as unknown as DeliveryRow]),
  );
  const tokenByDelivery = new Map<string, string>(
    (tokenRows ?? []).map((t) => [t.delivery_id, t.token]),
  );

  // 3. Process with concurrency cap
  const outcomes = await runWithConcurrency(
    dueRows as DueRow[],
    CONCURRENCY,
    (row) =>
      processOne(
        supabase,
        row,
        deliveryById.get(row.delivery_id) ?? null,
        tokenByDelivery.get(row.delivery_id) ?? null,
        base,
      ),
  );

  const summary: Record<string, number> = {};
  for (const o of outcomes) summary[o.kind] = (summary[o.kind] ?? 0) + 1;

  return jsonResponse(200, {
    data: { processed: dueRows.length, summary, outcomes },
    error: null,
  });
});

async function processOne(
  supabase: SupabaseClient,
  row: DueRow,
  delivery: DeliveryRow | null,
  token: string | null,
  base: string,
): Promise<Outcome> {
  if (!delivery || !token) {
    // Orphan scheduled_sends row (delivery deleted? token missing?) — terminal.
    await terminal(supabase, row.delivery_id, 'orphan_scheduled_send');
    return {
      kind: 'terminal_failure',
      delivery_id: row.delivery_id,
      error: 'orphan_scheduled_send',
    };
  }

  // Generate attachments from snapshot
  const snapshot = delivery.delivery_snapshot;
  let attachments: Attachment[];
  try {
    attachments = await buildAttachments(delivery.attachment_format, snapshot);
    assertTotalSize(attachments);
  } catch (e) {
    const errMsg = e instanceof AttachmentError
      ? `attachment_generation_failed: ${e.which}: ${e.message}`
      : (e instanceof Error
        ? `attachment_generation_failed: ${e.message}`
        : `attachment_generation_failed: ${String(e)}`);
    return await transientOrTerminal(supabase, row, errMsg);
  }

  // Send
  const feedbackUrl = buildFeedbackUrl(base, token);
  const body = applyFeedbackToBody(
    {
      html: delivery.body_html,
      text: delivery.body_text ?? '',
    },
    feedbackUrl,
  );
  const sender = snapshot.sender;
  const recipient = snapshot.recipient;
  let messageId: string;
  try {
    const result = await sendEmail({
      from: `${sender.from_name} <${sender.from_email}>`,
      to: recipient.email,
      cc: recipient.cc_emails.length > 0 ? recipient.cc_emails : undefined,
      bcc: recipient.bcc_emails_effective.length > 0
        ? recipient.bcc_emails_effective
        : undefined,
      reply_to: sender.reply_to_email,
      subject: delivery.subject,
      html: body.html,
      text: body.text,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
      idempotencyKey: delivery.id,
    });
    messageId = result.id;
  } catch (e) {
    if (e instanceof ResendError && e.kind === 'idempotency_collision_409') {
      // Code bug, not transient.
      await terminal(
        supabase,
        row.delivery_id,
        `resend_idempotency_collision: ${e.message}`,
      );
      return {
        kind: 'terminal_failure',
        delivery_id: row.delivery_id,
        error: `resend_idempotency_collision: ${e.message}`,
      };
    }
    const errMsg = e instanceof ResendError
      ? `resend_${e.kind}: ${e.message}`
      : (e instanceof Error ? e.message : String(e));
    return await transientOrTerminal(supabase, row, errMsg);
  }

  // Mark sent (audit event in same tx)
  const { error: markError } = await supabase.rpc('mark_delivery_sent_system', {
    p_delivery_id: row.delivery_id,
    p_resend_message_id: messageId,
  });
  if (markError) {
    // Email sent but audit write failed. Treat as transient so the next tick
    // re-attempts the mark (Resend dedupes the re-send via idempotency key).
    return await transientOrTerminal(
      supabase,
      row,
      `mark_delivery_sent_system failed: ${markError.message} (message_id=${messageId})`,
    );
  }
  return {
    kind: 'sent',
    delivery_id: row.delivery_id,
    resend_message_id: messageId,
  };
}

async function transientOrTerminal(
  supabase: SupabaseClient,
  row: DueRow,
  errMsg: string,
): Promise<Outcome> {
  const { data, error } = await supabase.rpc(
    'record_scheduled_attempt_failure',
    {
      p_scheduled_send_id: row.id,
      p_error_message: errMsg,
    },
  );
  if (error) {
    // Couldn't record the attempt; surface as terminal so we don't loop.
    await terminal(
      supabase,
      row.delivery_id,
      `record_scheduled_attempt_failure: ${error.message}; original: ${errMsg}`,
    );
    return {
      kind: 'terminal_failure',
      delivery_id: row.delivery_id,
      error: errMsg,
    };
  }
  const attemptsAfter = ((data as { attempts_after?: number }) ?? {})
    .attempts_after ?? row.attempts + 1;
  if (attemptsAfter >= MAX_ATTEMPTS) {
    await terminal(supabase, row.delivery_id, errMsg);
    return {
      kind: 'terminal_failure',
      delivery_id: row.delivery_id,
      error: errMsg,
    };
  }
  return {
    kind: 'transient_failure',
    delivery_id: row.delivery_id,
    attempts_after: attemptsAfter,
    error: errMsg,
  };
}

async function terminal(
  supabase: SupabaseClient,
  deliveryId: string,
  errMsg: string,
): Promise<void> {
  try {
    await supabase.rpc('mark_delivery_failed', {
      p_delivery_id: deliveryId,
      p_error_message: errMsg,
    });
  } catch {
    // Already returned to caller; log only.
    console.error(
      `mark_delivery_failed(${deliveryId}) failed for: ${errMsg}`,
    );
  }
}

async function buildAttachments(
  format: 'pdf' | 'word' | 'both',
  snapshot: DeliverySnapshot,
): Promise<Attachment[]> {
  const safeName = snapshot.project.name || 'delivery';
  const html = buildPdfHtml(snapshot);
  const meta = buildDocMeta(snapshot);
  const blocks = snapshot.variants.map((v) => ({
    variant_label: v.variant_label,
    variant_index: v.variant_index,
    body_text: v.body_text,
  }));
  const tasks: Promise<Attachment>[] = [];
  if (format === 'pdf' || format === 'both') {
    tasks.push(generatePdf(html, `${safeName}.pdf`));
  }
  if (format === 'word' || format === 'both') {
    tasks.push(generateDocx(blocks, `${safeName}.docx`, meta));
  }
  // Partial-success rejection: throw on the first failure so caller branches
  // to transient/terminal. Promise.all throws on first reject.
  return await Promise.all(tasks);
}

async function runWithConcurrency<T, U>(
  items: ReadonlyArray<T>,
  n: number,
  fn: (item: T) => Promise<U>,
): Promise<U[]> {
  const results: U[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(n, items.length)).fill(0).map(
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
