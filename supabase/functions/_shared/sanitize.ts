/**
 * Server-side HTML + subject sanitizer. The trust boundary is the server,
 * not the client — Tiptap output is mostly safe, but anything from the
 * composer flows through here before Resend sees it.
 *
 * Allowlist mirrors Tiptap's basic-block output. Anything outside this list
 * is dropped silently (no error response — composer should preview the same
 * shape, but a determined edit shouldn't break the send).
 */
import sanitizeHtmlLib from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'h1', 'h2', 'h3',
];
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

export function sanitizeHtml(input: string): string {
  return sanitizeHtmlLib(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ALLOWED_SCHEMES,
    disallowedTagsMode: 'discard',
  });
}

export function sanitizeSubject(input: string): string {
  return input
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

// Phase 7 fallback: when a snapshot variant has body_text but no body_html
// (Phase 5 composer only wrote body_html on Tiptap edit; fixtures or
// pre-edit variants land here null), render body_text into safe HTML so
// the public feedback page has something to display.
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
function escapeHtmlText(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeHtmlText(p).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
}
