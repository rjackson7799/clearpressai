import { describe, it, expect } from 'vitest';
import tsSrc from '../lib/delivery-template.ts?raw';
import denoSrc from '../../supabase/functions/_shared/delivery-template.ts?raw';
import {
  applyFeedbackToBody,
  buildComparisonSummary,
  buildFeedbackFooter,
  FEEDBACK_PLACEHOLDER,
} from '../lib/delivery-template';

function extractDriftRegion(src: string, name: string): string {
  const re = new RegExp(
    `// drift:start ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// drift:end ${name}`,
  );
  const match = src.match(re);
  if (!match) {
    throw new Error(`Could not locate drift region "${name}" in source`);
  }
  return match[1];
}

const DRIFT_REGIONS = ['COMPARISON_SUMMARY', 'FEEDBACK_FOOTER'] as const;

describe('delivery-template drift (TS mirror vs Deno _shared/delivery-template)', () => {
  for (const region of DRIFT_REGIONS) {
    it(`${region} region is byte-identical across both files`, () => {
      const ts = extractDriftRegion(tsSrc, region);
      const deno = extractDriftRegion(denoSrc, region);
      expect(deno).toBe(ts);
    });
  }
});

describe('buildComparisonSummary', () => {
  const variants = [
    {
      variant_index: 2,
      variant_label: 'Detailed',
      variation_directive: 'Lead with clinical data.',
      char_count: 1200,
    },
    {
      variant_index: 1,
      variant_label: 'Concise',
      variation_directive: 'Be concise.',
      char_count: 800,
    },
  ];

  it('sorts variants by variant_index', () => {
    const out = buildComparisonSummary(variants);
    const firstIdx = out.text.indexOf('Variant 1');
    const secondIdx = out.text.indexOf('Variant 2');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(firstIdx);
  });

  it('escapes HTML special chars in label and directive', () => {
    const out = buildComparisonSummary([
      {
        variant_index: 1,
        variant_label: 'A<script>B',
        variation_directive: 'D&E',
        char_count: 10,
      },
    ]);
    expect(out.html).not.toContain('<script>');
    expect(out.html).toContain('A&lt;script&gt;B');
    expect(out.html).toContain('D&amp;E');
  });

  it('falls back to "(指示なし / no directive)" when null', () => {
    const out = buildComparisonSummary([
      {
        variant_index: 1,
        variant_label: 'X',
        variation_directive: null,
        char_count: 10,
      },
    ]);
    expect(out.text).toContain('指示なし');
    expect(out.text).toContain('no directive');
  });

  it('emits both <ul> in html and a plain-text counterpart', () => {
    const out = buildComparisonSummary(variants);
    expect(out.html).toContain('<ul>');
    expect(out.html).toContain('</ul>');
    expect(out.text).toContain('バリアント比較');
    expect(out.text).toContain('Variant Comparison');
  });
});

describe('buildFeedbackFooter / applyFeedbackToBody', () => {
  const url = 'https://app.example.com/f/abcdef';

  it('builds bilingual footer with the URL', () => {
    const f = buildFeedbackFooter(url);
    expect(f.html).toContain(`<a href="${url}">${url}</a>`);
    expect(f.text).toContain(url);
    expect(f.html).toContain('30 days');
    expect(f.text).toContain('30 days');
  });

  it('substitutes placeholder when present (both html and text)', () => {
    const body = {
      html: `<p>Click ${FEEDBACK_PLACEHOLDER}.</p>`,
      text: `Click ${FEEDBACK_PLACEHOLDER}.`,
    };
    const out = applyFeedbackToBody(body, url);
    expect(out.html).toContain(url);
    expect(out.html).not.toContain(FEEDBACK_PLACEHOLDER);
    expect(out.text).toContain(url);
    expect(out.text).not.toContain(FEEDBACK_PLACEHOLDER);
  });

  it('appends footer when placeholder is absent', () => {
    const body = { html: '<p>hello</p>', text: 'hello' };
    const out = applyFeedbackToBody(body, url);
    expect(out.html).toContain('<hr/>');
    expect(out.html).toContain(url);
    expect(out.text).toContain('---');
    expect(out.text).toContain(url);
  });

  it('replaces ALL occurrences of placeholder, not just the first', () => {
    const body = {
      html: `<p>A ${FEEDBACK_PLACEHOLDER} B ${FEEDBACK_PLACEHOLDER}</p>`,
      text: `A ${FEEDBACK_PLACEHOLDER} B ${FEEDBACK_PLACEHOLDER}`,
    };
    const out = applyFeedbackToBody(body, url);
    expect(out.html.split(url).length - 1).toBe(2);
    expect(out.text.split(url).length - 1).toBe(2);
  });
});
