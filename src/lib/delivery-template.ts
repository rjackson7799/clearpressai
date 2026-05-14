/**
 * TS mirror of supabase/functions/_shared/delivery-template.ts. Composer uses
 * these helpers for the live preview block. The drift guard in
 * src/__tests__/delivery-template.drift.test.ts proves byte equality with the
 * Deno copy that the Edge Function uses at send time.
 */

// drift:start COMPARISON_SUMMARY
export function buildComparisonSummary(
  variants: ReadonlyArray<{
    variant_index: number;
    variant_label: string;
    variation_directive: string | null;
    char_count: number;
  }>,
): { html: string; text: string } {
  const sorted = variants.slice().sort((a, b) => a.variant_index - b.variant_index);
  const rows = sorted.map((v) => {
    const directive = v.variation_directive ?? '(指示なし / no directive)';
    const safeLabel = escapeHtml(v.variant_label);
    const safeDirective = escapeHtml(directive);
    return {
      html: `  <li><strong>バリアント ${v.variant_index} / Variant ${v.variant_index} — ${safeLabel}</strong>: ${safeDirective} (${v.char_count}字)</li>`,
      text: `バリアント ${v.variant_index} / Variant ${v.variant_index} — ${v.variant_label}: ${directive} (${v.char_count}字)`,
    };
  });

  const html =
    '<h2>バリアント比較 / Variant Comparison</h2>\n<ul>\n' +
    rows.map((r) => r.html).join('\n') +
    '\n</ul>';
  const text =
    'バリアント比較 / Variant Comparison\n\n' +
    rows.map((r) => r.text).join('\n');
  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// drift:end COMPARISON_SUMMARY

// drift:start FEEDBACK_FOOTER
export const FEEDBACK_PLACEHOLDER = '{{FEEDBACK_LINK}}';

export function buildFeedbackFooter(
  feedbackUrl: string,
): { html: string; text: string } {
  return {
    html:
      '<hr/>\n<p>ご感想・ご意見をお寄せください / Please share your feedback:<br/>\n' +
      `<a href="${feedbackUrl}">${feedbackUrl}</a><br/>\n` +
      '（リンクは30日間有効です / Link expires in 30 days）</p>',
    text:
      '---\nご感想・ご意見をお寄せください / Please share your feedback:\n' +
      feedbackUrl +
      '\n（リンクは30日間有効です / Link expires in 30 days）',
  };
}

export function applyFeedbackToBody(
  body: { html: string; text: string },
  feedbackUrl: string,
): { html: string; text: string } {
  const footer = buildFeedbackFooter(feedbackUrl);
  const html = body.html.includes(FEEDBACK_PLACEHOLDER)
    ? body.html.split(FEEDBACK_PLACEHOLDER).join(feedbackUrl)
    : body.html + '\n' + footer.html;
  const text = body.text.includes(FEEDBACK_PLACEHOLDER)
    ? body.text.split(FEEDBACK_PLACEHOLDER).join(feedbackUrl)
    : body.text + '\n\n' + footer.text;
  return { html, text };
}
// drift:end FEEDBACK_FOOTER
