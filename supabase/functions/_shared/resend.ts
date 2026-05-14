/**
 * Typed wrapper around Resend's POST /emails endpoint.
 *
 * Headers per Resend API conventions:
 *   - Idempotency-Key: caller-supplied (delivery_id); 24-hour retention per
 *     https://resend.com/docs/dashboard/emails/idempotency-keys
 *   - User-Agent: identifies this client; required by
 *     https://resend.com/docs/api-reference/introduction
 *
 * Discriminated error kinds let callers branch:
 *   - 'idempotency_collision_409' → code bug (same key, different body); not retried
 *   - 'rate_limited_429' → transient; cron path increments attempts
 *   - 'auth_401' → misconfig; not retried
 *   - 'other' → unknown; treated as terminal by the immediate path
 */

export type ResendErrorKind =
  | 'idempotency_collision_409'
  | 'rate_limited_429'
  | 'auth_401'
  | 'other';

export class ResendError extends Error {
  constructor(
    public kind: ResendErrorKind,
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ResendError';
  }
}

export interface ResendAttachment {
  filename: string;
  content: string;
}

export interface ResendSendPayload {
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: ResendAttachment[];
  idempotencyKey: string;
}

const USER_AGENT = 'ClearPress-AI/1.0 (+https://clearpress.local)';

export async function sendEmail(
  payload: ResendSendPayload,
): Promise<{ id: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    throw new ResendError('other', 'RESEND_API_KEY not set', 0);
  }
  const { idempotencyKey, ...body } = payload;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    const data = await res.json();
    if (typeof data?.id !== 'string') {
      throw new ResendError('other', 'Resend response missing id', res.status);
    }
    return { id: data.id };
  }
  const errBody = await res.text();
  if (res.status === 409) {
    throw new ResendError('idempotency_collision_409', errBody, 409);
  }
  if (res.status === 429) {
    throw new ResendError('rate_limited_429', errBody, 429);
  }
  if (res.status === 401) {
    throw new ResendError('auth_401', errBody, 401);
  }
  throw new ResendError('other', errBody, res.status);
}
