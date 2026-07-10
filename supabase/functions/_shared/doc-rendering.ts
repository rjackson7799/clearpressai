/**
 * Shared HTML rendering for PDF attachments + small metadata helpers
 * reused by both the DOCX and PDF paths.
 *
 * Single source of truth for buildPdfHtml — both send-delivery (immediate)
 * and process-scheduled-sends (cron) used to carry their own copy. The two
 * were 95% identical and any drift between them produced subtly different
 * client-facing documents depending on which path shipped.
 *
 * No 'docx' import here — pure string rendering keeps this module Node-safe
 * so the vitest suite can exercise it directly.
 */
import type { DeliverySnapshot } from './types-delivery.ts';

export interface DocMeta {
  projectName: string;
  versionLabel: string;
  dateJst: string;
}

export function formatVersionLabel(report: {
  version_major: number;
  version_minor: number;
}): string {
  return `v${report.version_major}.${report.version_minor}`;
}

export function formatJstDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export function buildDocMeta(snapshot: DeliverySnapshot): DocMeta {
  return {
    projectName: snapshot.project.name,
    versionLabel: formatVersionLabel(snapshot.audit_report),
    dateJst: formatJstDate(snapshot.audit_report.finalized_at),
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BANNER_TEXT = '確認用 — DRAFT FOR REVIEW';

function buildFooterText(meta: DocMeta): string {
  return `${meta.projectName} · ${meta.versionLabel} · 確認用 / For Review · ${meta.dateJst}`;
}

export function buildPdfHtml(snapshot: DeliverySnapshot): string {
  const sections = snapshot.variants
    .slice()
    .sort((a, b) => a.variant_index - b.variant_index)
    .map((v) => {
      const body = v.body_html ?? `<pre>${escapeHtml(v.body_text)}</pre>`;
      return [
        '<section>',
        `<h2>Variant ${v.variant_index} — ${escapeHtml(v.variant_label)}</h2>`,
        body,
        '</section>',
      ].join('\n');
    })
    .join('\n');

  // The DRAFT banner + footer are NOT in this HTML — they're passed to pdfshift
  // as native header/footer request options (buildPdfOptions) so they repeat on
  // every page. pdfshift v3 is Chromium, which ignores CSS running-elements.
  // overflow-wrap: anywhere is required because Chromium won't break space-free
  // Japanese to fit the page without an explicit break opportunity.
  const style = `
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.7;
      color: #111827;
      overflow-wrap: anywhere;
    }
    section + section { page-break-before: always; }
    h2 {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 0;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: inherit;
    }
  `;

  return [
    '<!doctype html>',
    '<html lang="ja">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(snapshot.project.name)}</title>`,
    `<style>${style}</style>`,
    '</head>',
    '<body>',
    sections,
    '</body>',
    '</html>',
  ].join('\n');
}

const PDF_FONT_STACK =
  "'Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif";

// pdfshift header/footer are rendered independently and do NOT inherit body CSS
// or sanitization — style inline and escape any dynamic content here.
export function buildPdfHeaderSource(): string {
  return `<div style="font-family:${PDF_FONT_STACK};`
    + `width:100%;background:#ea580c;color:#fff;text-align:center;`
    + `padding:6px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;">`
    + `${escapeHtml(BANNER_TEXT)}</div>`;
}

export function buildPdfFooterSource(meta: DocMeta): string {
  // meta.projectName is untrusted; escapeHtml is the injection guard for the
  // independently-rendered footer markup.
  return `<div style="font-family:${PDF_FONT_STACK};`
    + `width:100%;color:#6b7280;text-align:center;font-size:9px;">`
    + `${escapeHtml(buildFooterText(meta))}</div>`;
}

// pdfshift v3 dimensions. PROVISIONAL — tuned against a real sandbox render;
// top margin must clear the header, bottom margin must clear the footer.
const PDF_HEADER_HEIGHT = '48';
const PDF_FOOTER_HEIGHT = '32';
const PDF_MARGIN = { top: '90', right: '40', bottom: '60', left: '40' } as const;

export interface PdfOptions {
  readonly header?: {
    readonly source: string;
    readonly height?: string;
    readonly start_at?: number;
  };
  readonly footer?: {
    readonly source: string;
    readonly height?: string;
    readonly start_at?: number;
  };
  readonly margin?: {
    readonly top: string;
    readonly right: string;
    readonly bottom: string;
    readonly left: string;
  };
  readonly format?: string;
}

// Single source of truth for the PDF request options — both send paths call
// this, so immediate + scheduled deliveries can't drift.
export function buildPdfOptions(meta: DocMeta): PdfOptions {
  return {
    format: 'A4',
    header: { source: buildPdfHeaderSource(), height: PDF_HEADER_HEIGHT },
    footer: { source: buildPdfFooterSource(meta), height: PDF_FOOTER_HEIGHT },
    margin: PDF_MARGIN,
  };
}

// Pure pdfshift request-body assembly. `source` is spread last so a caller can't
// override the document HTML through opts.
export function buildPdfConvertBody(
  html: string,
  opts: PdfOptions = {},
): Record<string, unknown> {
  return { ...opts, source: html };
}

export const DRAFT_BANNER_TEXT = BANNER_TEXT;
export const buildPdfFooterText = buildFooterText;
