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
  const meta = buildDocMeta(snapshot);
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

  const footerHtml = escapeHtml(buildFooterText(meta));
  const bannerHtml = escapeHtml(BANNER_TEXT);

  const style = `
    @page {
      margin: 90px 40px 60px;
      @top-center { content: element(running-banner); }
      @bottom-center { content: element(running-footer); }
    }
    .running-banner {
      position: running(running-banner);
      background: #ea580c;
      color: #ffffff;
      text-align: center;
      padding: 8px 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .running-footer {
      position: running(running-footer);
      color: #6b7280;
      text-align: center;
      font-size: 9px;
    }
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.7;
      color: #111827;
    }
    section + section { page-break-before: always; }
    h2 {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 4px;
      margin-top: 0;
    }
    pre {
      white-space: pre-wrap;
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
    `<div class="running-banner">${bannerHtml}</div>`,
    `<div class="running-footer">${footerHtml}</div>`,
    sections,
    '</body>',
    '</html>',
  ].join('\n');
}

export const DRAFT_BANNER_TEXT = BANNER_TEXT;
export const buildPdfFooterText = buildFooterText;
