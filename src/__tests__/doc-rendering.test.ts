import { describe, expect, it } from 'vitest';
import {
  buildDocMeta,
  buildPdfConvertBody,
  buildPdfFooterSource,
  buildPdfFooterText,
  buildPdfHeaderSource,
  buildPdfHtml,
  buildPdfOptions,
  DRAFT_BANNER_TEXT,
  formatJstDate,
  formatVersionLabel,
} from '../../supabase/functions/_shared/doc-rendering';
import type { PdfOptions } from '../../supabase/functions/_shared/doc-rendering';
import type { DeliverySnapshot } from '../../supabase/functions/_shared/types-delivery';

const fixture: DeliverySnapshot = {
  project: { id: '11111111-1111-4111-8111-111111111111', name: 'Q1 Press 2026' },
  content_item: {
    id: '22222222-2222-4222-8222-222222222222',
    content_sub_type: 'partner_ack',
  },
  variants: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      variant_label: 'フォーマル',
      variant_index: 1,
      body_html: '<p>本日、共同研究契約を締結しました。</p>',
      body_text: '本日、共同研究契約を締結しました。',
      variation_directive: 'Lead with the news.',
      char_count: 30,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      variant_label: 'カジュアル',
      variant_index: 2,
      body_html: null,
      body_text: '研究 & 開発 <重要な話>',
      variation_directive: null,
      char_count: 30,
    },
  ],
  recommended_variant_id: null,
  audit_report: {
    id: '55555555-5555-4555-8555-555555555555',
    version_major: 1,
    version_minor: 0,
    finalized_at: '2026-05-13T10:00:00.000Z',
    signature_hash: 'deadbeef',
  },
  sender: {
    from_name: 'ClearPress AI',
    from_email: 'noreply@clearpressai.com',
    reply_to_email: 'ryan@example.com',
    sent_by_email_snapshot: 'ryan@example.com',
  },
  recipient: {
    email: 'client@example.com',
    name: 'Client Co',
    cc_emails: [],
    bcc_emails_effective: [],
  },
  scheduling_warnings: [],
};

describe('formatVersionLabel', () => {
  it('formats v1.0', () => {
    expect(formatVersionLabel({ version_major: 1, version_minor: 0 })).toBe('v1.0');
  });
  it('formats v2.3', () => {
    expect(formatVersionLabel({ version_major: 2, version_minor: 3 })).toBe('v2.3');
  });
});

describe('formatJstDate', () => {
  it('converts UTC midnight to JST same-day +9h', () => {
    // 2026-05-13T10:00:00Z is 2026-05-13T19:00 JST → same day
    expect(formatJstDate('2026-05-13T10:00:00.000Z')).toBe('2026-05-13');
  });
  it('handles UTC time that crosses to next day in JST', () => {
    // 2026-05-13T16:00:00Z is 2026-05-14T01:00 JST → next day
    expect(formatJstDate('2026-05-13T16:00:00.000Z')).toBe('2026-05-14');
  });
  it('returns empty string for invalid input', () => {
    expect(formatJstDate('not a date')).toBe('');
  });
});

describe('buildDocMeta', () => {
  it('derives project, version, and JST date from snapshot', () => {
    expect(buildDocMeta(fixture)).toEqual({
      projectName: 'Q1 Press 2026',
      versionLabel: 'v1.0',
      dateJst: '2026-05-13',
    });
  });
});

describe('buildPdfFooterText', () => {
  it('joins meta with bullet separators including DRAFT marker', () => {
    expect(
      buildPdfFooterText({
        projectName: 'Q1 Press 2026',
        versionLabel: 'v1.0',
        dateJst: '2026-05-13',
      }),
    ).toBe('Q1 Press 2026 · v1.0 · 確認用 / For Review · 2026-05-13');
  });
});

describe('buildPdfHtml', () => {
  const html = buildPdfHtml(fixture);

  it('does NOT embed the banner/footer in the body (moved to pdfshift header/footer options)', () => {
    expect(html).not.toContain(DRAFT_BANNER_TEXT);
    expect(html).not.toContain('DRAFT FOR REVIEW');
    expect(html).not.toContain('class="running-banner"');
    expect(html).not.toContain('running-footer');
  });

  it('emits no CSS paged-media running elements (unsupported by Chromium/pdfshift)', () => {
    expect(html).not.toContain('running(');
    expect(html).not.toContain('@top-center');
    expect(html).not.toContain('@bottom-center');
    expect(html).not.toContain('@page');
  });

  it('sets overflow-wrap: anywhere on both body and pre so space-free CJK wraps', () => {
    const matches = html.match(/overflow-wrap: anywhere/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('white-space: pre-wrap');
  });

  it('renders each variant as a section with sorted variant_index', () => {
    const i1 = html.indexOf('Variant 1 — フォーマル');
    const i2 = html.indexOf('Variant 2 — カジュアル');
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(-1);
    expect(i1).toBeLessThan(i2);
  });

  it('uses body_html when present and an escaped <pre> when body_html is null', () => {
    expect(html).toContain('<p>本日、共同研究契約を締結しました。</p>');
    expect(html).toContain('<pre>研究 &amp; 開発 &lt;重要な話&gt;</pre>');
    expect(html).not.toContain('<重要な話>');
  });

  it('html-escapes the project name in <title> and variant label', () => {
    const malicious: DeliverySnapshot = {
      ...fixture,
      project: { ...fixture.project, name: 'Q1 <script>alert(1)</script>' },
      variants: [
        {
          ...fixture.variants[0],
          variant_label: '<img onerror=x>',
        },
      ],
    };
    const out = buildPdfHtml(malicious);
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&lt;img onerror=x&gt;');
  });

  it('emits a valid HTML5 doctype + lang="ja" document', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('<meta charset="utf-8">');
  });
});

describe('buildPdfHeaderSource', () => {
  it('contains the DRAFT banner text on the orange background', () => {
    const src = buildPdfHeaderSource();
    expect(src).toContain('確認用');
    expect(src).toContain('DRAFT FOR REVIEW');
    expect(src).toContain('#ea580c');
  });
});

describe('buildPdfFooterSource', () => {
  const meta = buildDocMeta(fixture);

  it('contains project, version, JA/EN draft label, and JST date', () => {
    const src = buildPdfFooterSource(meta);
    expect(src).toContain('Q1 Press 2026');
    expect(src).toContain('v1.0');
    expect(src).toContain('確認用 / For Review');
    expect(src).toContain('2026-05-13');
  });

  it('html-escapes an injection payload in the project name', () => {
    const src = buildPdfFooterSource({
      ...meta,
      projectName: '</div><script>alert(1)</script>',
    });
    expect(src).not.toContain('<script>alert(1)</script>');
    expect(src).not.toContain('</div><script>');
    expect(src).toContain('&lt;script&gt;');
    expect(src).toContain('&lt;/div&gt;');
  });

  it('escapes ampersands and double quotes', () => {
    const src = buildPdfFooterSource({ ...meta, projectName: 'A & "B"' });
    expect(src).toContain('A &amp; &quot;B&quot;');
  });

  it('handles a Japanese project name', () => {
    const src = buildPdfFooterSource({ ...meta, projectName: '第一三共 リリース' });
    expect(src).toContain('第一三共 リリース');
  });

  it('tolerates an empty date without crashing', () => {
    const src = buildPdfFooterSource({ ...meta, dateJst: '' });
    expect(typeof src).toBe('string');
    expect(src).toContain('Q1 Press 2026');
  });
});

describe('buildPdfOptions', () => {
  const opts = buildPdfOptions(buildDocMeta(fixture));

  it('pins A4 format', () => {
    expect(opts.format).toBe('A4');
  });

  it('wires the banner header and the meta-derived footer', () => {
    expect(opts.header?.source).toBe(buildPdfHeaderSource());
    expect(opts.footer?.source).toContain('Q1 Press 2026');
    expect(opts.header?.height).toBeTruthy();
    expect(opts.footer?.height).toBeTruthy();
  });

  it('provides four-sided page margins', () => {
    expect(opts.margin).toMatchObject({
      top: expect.any(String),
      right: expect.any(String),
      bottom: expect.any(String),
      left: expect.any(String),
    });
  });
});

describe('buildPdfConvertBody', () => {
  it('retains source and preserves current behavior with empty opts', () => {
    expect(buildPdfConvertBody('<p>x</p>')).toEqual({ source: '<p>x</p>' });
  });

  it('serializes header, footer, margin, and format exactly', () => {
    const opts = buildPdfOptions(buildDocMeta(fixture));
    const body = buildPdfConvertBody('<p>x</p>', opts);
    expect(body).toEqual({ ...opts, source: '<p>x</p>' });
    expect(body.source).toBe('<p>x</p>');
    expect(body.format).toBe('A4');
  });

  it('does not let opts override the source html', () => {
    const body = buildPdfConvertBody(
      '<p>real</p>',
      { source: 'evil' } as unknown as PdfOptions,
    );
    expect(body.source).toBe('<p>real</p>');
  });
});
