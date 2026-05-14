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
  const trimmed = base.replace(/\/+$/, '');
  return `${trimmed}/f/${token}`;
}
