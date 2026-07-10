/**
 * send-delivery — Edge Function (JWT-gated, user actor)
 *
 * Immediate + scheduled both flow through here. Pseudocode:
 *
 *   1. Auth via JWT (createSupabaseFromRequest + getUserIdFromAuth).
 *   2. Parse ComposerInput.
 *   3. Sanitize subject + body_html at the trust boundary (Tiptap output
 *      is usually safe; server validates).
 *   4. Call create_delivery RPC (single writer of delivery_snapshot).
 *   5. Scheduled path: return early. process-scheduled-sends picks it up
 *      from delivery_snapshot when the time arrives.
 *   6. Immediate path:
 *      a. Build feedback URL from token + PUBLIC_FEEDBACK_URL_BASE.
 *      b. Substitute {{FEEDBACK_LINK}} or append footer to body
 *         (both html and text).
 *      c. Generate attachments per format (pdf, word, both) from
 *         delivery_snapshot.variants. Partial-success is rejected:
 *         attachment_format='both' means BOTH must succeed.
 *      d. Resend send with Idempotency-Key=delivery_id.
 *      e. On success: mark_delivery_sent_user RPC (audit event in same tx).
 *      f. On any failure: mark_delivery_failed RPC + 502 response.
 */
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
  getUserIdFromAuth,
} from '../_shared/auth.ts';
import {
  ComposerInputSchema,
  type DeliverySnapshot,
} from '../_shared/types-delivery.ts';
import { sanitizeHtml, sanitizeSubject } from '../_shared/sanitize.ts';
import { applyFeedbackToBody } from '../_shared/delivery-template.ts';
import { buildFeedbackUrl } from '../_shared/magic-link.ts';
import {
  type Attachment,
  AttachmentError,
  assertTotalSize,
  generateDocx,
  generatePdf,
} from '../_shared/attachments.ts';
import {
  buildDocMeta,
  buildPdfHtml,
  buildPdfOptions,
} from '../_shared/doc-rendering.ts';
import { ResendError, sendEmail } from '../_shared/resend.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CreateDeliveryResponse {
  delivery_id: string;
  token: string;
  delivery_snapshot: DeliverySnapshot;
  status: 'draft' | 'scheduled';
  scheduled_for: string | null;
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

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseFromRequest(req);
    await getUserIdFromAuth(supabase);
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
  const parsed = ComposerInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      code: 'validation_error',
      message: 'Invalid input',
      details: parsed.error.issues,
    });
  }
  const input = parsed.data;

  // Trust-boundary sanitization. Persisted body matches what Resend sees.
  const cleanSubject = sanitizeSubject(input.subject);
  const cleanBodyHtml = sanitizeHtml(input.body_html);
  const cleanBodyText = input.body_text ?? stripHtmlToText(cleanBodyHtml);

  const rpcPayload = {
    ...input,
    subject: cleanSubject,
    body_html: cleanBodyHtml,
    body_text: cleanBodyText,
    // RPC tolerates missing arrays; pass through if present.
    cc_emails: input.cc_emails ?? [],
    bcc_emails: input.bcc_emails ?? [],
    scheduling_warnings: input.scheduling_warnings ?? [],
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'create_delivery',
    {
      p_payload: rpcPayload,
      p_scheduled_for: (input.scheduled_for ?? null) as unknown as string,
    },
  );
  if (rpcError) {
    if (rpcError.code === 'P0004') {
      return jsonError(409, {
        code: 'validation_error',
        message: rpcError.message,
      });
    }
    return jsonError(500, {
      code: 'internal_error',
      message: `create_delivery failed: ${rpcError.message}`,
    });
  }
  const created = rpcData as unknown as CreateDeliveryResponse;

  if (created.status === 'scheduled') {
    return jsonResponse(200, {
      data: {
        delivery_id: created.delivery_id,
        status: 'scheduled',
        scheduled_for: created.scheduled_for,
      },
      error: null,
    });
  }

  // Immediate path
  const base = Deno.env.get('PUBLIC_FEEDBACK_URL_BASE');
  if (!base) {
    await markFailed(
      supabase,
      created.delivery_id,
      'PUBLIC_FEEDBACK_URL_BASE not set',
    );
    return jsonError(500, {
      code: 'internal_error',
      message: 'PUBLIC_FEEDBACK_URL_BASE not set',
    });
  }
  const feedbackUrl = buildFeedbackUrl(base, created.token);
  const body = applyFeedbackToBody(
    { html: cleanBodyHtml, text: cleanBodyText },
    feedbackUrl,
  );

  const snapshot = created.delivery_snapshot;
  const attachmentPlan = planAttachments(input.attachment_format, snapshot);
  const results = await Promise.allSettled(attachmentPlan.tasks);
  const fails: string[] = [];
  const attachments: Attachment[] = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled') attachments.push(r.value);
    else {
      const reason = r.reason instanceof AttachmentError
        ? `${r.reason.which}: ${r.reason.message}`
        : (r.reason instanceof Error
          ? r.reason.message
          : String(r.reason));
      fails.push(reason);
    }
  });
  if (fails.length > 0) {
    const errMsg = `attachment_generation_failed: ${fails.join('; ')}`;
    await markFailed(supabase, created.delivery_id, errMsg);
    return jsonError(502, { code: 'internal_error', message: errMsg });
  }
  try {
    assertTotalSize(attachments);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await markFailed(supabase, created.delivery_id, errMsg);
    return jsonError(502, { code: 'internal_error', message: errMsg });
  }

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
      subject: cleanSubject,
      html: body.html,
      text: body.text,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
      idempotencyKey: created.delivery_id,
    });
    messageId = result.id;
  } catch (e) {
    const errMsg = e instanceof ResendError
      ? `resend_${e.kind}: ${e.message}`
      : (e instanceof Error ? e.message : String(e));
    await markFailed(supabase, created.delivery_id, errMsg);
    return jsonError(502, { code: 'internal_error', message: errMsg });
  }

  const { error: markError } = await supabase.rpc('mark_delivery_sent_user', {
    p_delivery_id: created.delivery_id,
    p_resend_message_id: messageId,
  });
  if (markError) {
    // Email sent but audit write failed. Surface as 500 with the message id
    // so ops can reconcile manually. Distinct marker for log search — the
    // email/cost is already spent, so this must never be silently lost.
    console.error(
      `RECONCILE_NEEDED delivery=${created.delivery_id} resend_message_id=${messageId} mark_delivery_sent_user_error=${markError.message}`,
    );
    return jsonError(500, {
      code: 'internal_error',
      message:
        `mark_delivery_sent_user failed: ${markError.message} (sent_message_id=${messageId})`,
    });
  }

  return jsonResponse(200, {
    data: {
      delivery_id: created.delivery_id,
      status: 'sent',
      resend_message_id: messageId,
    },
    error: null,
  });
});

function planAttachments(
  format: 'pdf' | 'word' | 'both',
  snapshot: DeliverySnapshot,
): { tasks: Promise<Attachment>[] } {
  const projectName = snapshot.project.name;
  const safeName = projectName || 'delivery';
  const variants = snapshot.variants;
  const html = buildPdfHtml(snapshot);
  const meta = buildDocMeta(snapshot);
  const blocks = variants.map((v) => ({
    variant_label: v.variant_label,
    variant_index: v.variant_index,
    body_text: v.body_text,
  }));

  const tasks: Promise<Attachment>[] = [];
  if (format === 'pdf' || format === 'both') {
    tasks.push(generatePdf(html, `${safeName}.pdf`, buildPdfOptions(meta)));
  }
  if (format === 'word' || format === 'both') {
    tasks.push(generateDocx(blocks, `${safeName}.docx`, meta));
  }
  return { tasks };
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function markFailed(
  supabase: SupabaseClient,
  deliveryId: string,
  errorMessage: string,
): Promise<void> {
  try {
    await supabase.rpc('mark_delivery_failed', {
      p_delivery_id: deliveryId,
      p_error_message: errorMessage,
    });
  } catch {
    // Logged via the surrounding response.
  }
}
