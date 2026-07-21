/**
 * Feedback magic-link helpers.
 *
 * Per reviewer feedback (revision 2): token GENERATION is DB-only, owned by
 * create_delivery's gen_random_bytes(32) + URL-safe base64. This module is
 * the URL-building + format-validation half. No mint() function on purpose.
 */

const TOKEN_REGEX = /^[A-Za-z0-9_-]{43}$/;

export function isValidTokenFormat(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

export function buildFeedbackUrl(base: string, token: string): string {
  if (!isValidTokenFormat(token)) {
    throw new Error('invalid_token_format');
  }
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    throw new Error('invalid_feedback_base');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('invalid_feedback_base');
  }
  // The feedback route lives at the app root (/f/:token). Build from the origin
  // so a base misconfigured with a trailing "/f" (or any stray path / query /
  // fragment) can't produce /f/f/<token>, which fails to match the route and
  // 404s. Warn on an unexpected path so the misconfig stays visible in the
  // Edge Function logs instead of being silently normalized away.
  const path = u.pathname.replace(/\/+$/, '');
  if (path !== '' && path !== '/f') {
    console.warn(`buildFeedbackUrl: ignoring unexpected base path "${u.pathname}"`);
  }
  return `${u.origin}/f/${token}`;
}
