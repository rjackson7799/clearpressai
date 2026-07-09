/**
 * notify-feedback — Edge Function (JWT-gated, firm-side)
 *
 * Sends a best-effort "new internal feedback" email when a firm user submits
 * an item on the /feedback tracker. The feedback row is already persisted by
 * the client (useCreateInternalFeedback); this endpoint only notifies.
 *
 * Auth: the firm-side caller's JWT is verified (establishes a logged-in user).
 * A service-role client is then used for the app_config + joined reads.
 *
 * Input: { feedback_id: uuid }
 * Output (HTTP 200 always for the happy + best-effort paths):
 *   { data: { sent: boolean }, error: null }
 *
 * Best-effort: if FEEDBACK_NOTIFY_EMAILS / RESEND_FROM_* are unset, or Resend
 * fails, we log and still return 200 — email must never gate the submission.
 */
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { handlePreflight } from '../_shared/cors.ts';
import { jsonError, jsonResponse } from '../_shared/errors.ts';
import {
  AuthError,
  createSupabaseFromRequest,
  getUserIdFromAuth,
} from '../_shared/auth.ts';
import { ResendError, sendEmail } from '../_shared/resend.ts';

const InputSchema = z.object({
  feedback_id: z.string().uuid(),
});

const TYPE_LABEL: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature request',
  improvement: 'Improvement',
};

interface FeedbackRow {
  id: string;
  type: string;
  message: string;
  created_at: string;
  created_by_user: { email: string } | null;
  internal_feedback_attachments: { id: string }[];
}

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );
  } catch {
    return [];
  }
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
  if (!url || !serviceKey) {
    return jsonError(500, {
      code: 'internal_error',
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  // Verify the firm-side caller (JWT). No per-firm authz in v1 (single-tenant).
  try {
    const authSupabase = createSupabaseFromRequest(req);
    await getUserIdFromAuth(authSupabase);
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError(401, { code: 'permission_denied', message: e.message });
    }
    throw e;
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError(400, {
      code: 'validation_error',
      message: 'Invalid JSON body',
    });
  }
  const parsed = InputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      code: 'validation_error',
      message: 'feedback_id must be a uuid',
    });
  }
  const { feedback_id } = parsed.data;

  const supabase = createClient(url, serviceKey);

  const { data: row, error: rowError } = await supabase
    .from('internal_feedback')
    .select(
      'id, type, message, created_at, created_by_user:users!internal_feedback_created_by_fkey(email), internal_feedback_attachments(id)',
    )
    .eq('id', feedback_id)
    .single<FeedbackRow>();
  if (rowError || !row) {
    return jsonError(404, {
      code: 'not_found',
      message: 'feedback not found',
    });
  }

  const { data: configRows } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', [
      'FEEDBACK_NOTIFY_EMAILS',
      'APP_URL_BASE',
      'RESEND_FROM_NAME',
      'RESEND_FROM_EMAIL',
    ]);
  const config = new Map<string, string>(
    (configRows ?? []).map((r) => [r.key as string, r.value as string]),
  );

  const recipients = parseEmailList(config.get('FEEDBACK_NOTIFY_EMAILS'));
  const fromName = config.get('RESEND_FROM_NAME');
  const fromEmail = config.get('RESEND_FROM_EMAIL');
  if (recipients.length === 0 || !fromName || !fromEmail) {
    console.warn(
      'notify-feedback: no recipients or sender configured; skipping email',
    );
    return jsonResponse(200, { data: { sent: false }, error: null });
  }

  const appBase = (config.get('APP_URL_BASE') ?? '').replace(/\/+$/, '');
  const typeLabel = TYPE_LABEL[row.type] ?? row.type;
  const excerpt =
    row.message.length > 500 ? `${row.message.slice(0, 500)}…` : row.message;
  const submitter = row.created_by_user?.email ?? 'unknown';
  const attachmentCount = row.internal_feedback_attachments?.length ?? 0;
  const link = appBase ? `${appBase}/feedback` : '(app URL not configured)';

  const text = [
    `New ${typeLabel} feedback was submitted.`,
    '',
    `Submitted by: ${submitter}`,
    `Attachments: ${attachmentCount}`,
    '',
    excerpt,
    '',
    `View in app: ${link}`,
  ].join('\n');

  const [primary, ...rest] = recipients;
  try {
    await sendEmail({
      from: `${fromName} <${fromEmail}>`,
      to: primary,
      bcc: rest.length > 0 ? rest : undefined,
      subject: `[ClearPress] New ${typeLabel} feedback`,
      text,
      idempotencyKey: feedback_id,
    });
    return jsonResponse(200, { data: { sent: true }, error: null });
  } catch (e) {
    // Best-effort: log and still return 200 — the row is the source of truth.
    const detail = e instanceof ResendError ? `${e.kind}: ${e.message}` : String(e);
    console.error('notify-feedback: Resend send failed', detail);
    return jsonResponse(200, { data: { sent: false }, error: null });
  }
});
