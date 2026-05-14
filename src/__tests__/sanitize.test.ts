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
