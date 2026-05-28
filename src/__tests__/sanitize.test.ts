import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeSubject,
} from '../../supabase/functions/_shared/sanitize';

describe('sanitizeHtml allowlist', () => {
  it('keeps allowed tags (p, strong, em)', () => {
    const input = '<p>Hello <strong>world</strong> <em>!</em></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('keeps lists and headings', () => {
    const input = '<h2>Title</h2><ul><li>a</li><li>b</li></ul>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('keeps anchor with http/https/mailto href', () => {
    expect(sanitizeHtml('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com">x</a>',
    );
    expect(sanitizeHtml('<a href="mailto:a@b.com">x</a>')).toBe(
      '<a href="mailto:a@b.com">x</a>',
    );
  });

  it('strips <script> tags', () => {
    const out = sanitizeHtml('<p>safe</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert');
    expect(out).toContain('<p>safe</p>');
  });

  it('strips event handlers like onclick', () => {
    const out = sanitizeHtml('<p onclick="alert(1)">click</p>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('<p>click</p>');
  });

  it('strips javascript: and data: schemes from href', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain(
      'javascript:',
    );
    expect(sanitizeHtml('<a href="data:text/html,...">x</a>')).not.toContain(
      'data:',
    );
  });

  it('drops disallowed tags (div, span, img, iframe)', () => {
    const out = sanitizeHtml('<div><span>x</span><img src="y"><iframe></iframe></div>');
    expect(out).not.toContain('<div');
    expect(out).not.toContain('<span');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<iframe');
  });

  it('round-trips a realistic Tiptap variant body unchanged (Phase 7 feedback-page guard)', () => {
    // Representative shape of what variant-generation produces today —
    // confirms the sanitize pass in feedback-load doesn't strip legitimate
    // content. Anchors with https: hrefs survive; basic block tags survive.
    const input =
      '<h2>新製品リリース</h2>' +
      '<p><strong>2026年5月19日</strong> — 株式会社例の新製品について発表しました。</p>' +
      '<ul><li>臨床試験結果が <em>良好</em> でした。</li><li>承認は順調に進んでいます。</li></ul>' +
      '<p>詳細は <a href="https://example.com/news/1">プレスリリース</a> をご覧ください。</p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('neutralizes an LLM-jailbreak-style XSS payload (Phase 7 feedback-page guard)', () => {
    // If a variant-generation regression (or prompt-injection in the brief)
    // ever produced HTML with active content, the public feedback page
    // must not execute it. This test pins the defence: every attack vector
    // is stripped while the surrounding legitimate text survives.
    const input =
      '<p>Hello</p>' +
      '<img src="x" onerror="alert(1)">' +
      '<a href="javascript:fetch(\'/steal\')">click</a>' +
      '<style>body{background:red}</style>' +
      '<svg><script>alert(2)</script></svg>';
    const out = sanitizeHtml(input);
    expect(out).toContain('<p>Hello</p>');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('<svg');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert');
  });
});

describe('sanitizeSubject', () => {
  it('strips CR and LF (header injection guard)', () => {
    expect(sanitizeSubject('Hello\r\nBcc: x@y.com')).not.toContain('\r');
    expect(sanitizeSubject('Hello\r\nBcc: x@y.com')).not.toContain('\n');
  });

  it('collapses repeated whitespace', () => {
    expect(sanitizeSubject('a    b\t\tc')).toBe('a b c');
  });

  it('trims leading/trailing whitespace', () => {
    expect(sanitizeSubject('  hello  ')).toBe('hello');
  });

  it('caps at 200 chars', () => {
    const long = 'x'.repeat(300);
    expect(sanitizeSubject(long).length).toBe(200);
  });
});
