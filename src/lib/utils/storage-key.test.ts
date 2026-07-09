import { describe, it, expect } from 'vitest';
import { safeStorageKey } from './storage-key';

const UUID_PREFIX = '11111111-1111-4111-8111-111111111111';
const ASCII_KEY = /^[\w/-]+(\.[a-z0-9]+)?$/;

describe('safeStorageKey', () => {
  it('produces an ASCII-only key for a Japanese filename', () => {
    const f = new File(['x'], 'アストラゼネカのカルケンス20211210.pdf', {
      type: 'application/pdf',
    });
    const key = safeStorageKey(UUID_PREFIX, f);
    expect(key).toMatch(ASCII_KEY);
    expect(key.startsWith(`${UUID_PREFIX}/`)).toBe(true);
  });

  it('keeps the extension for a Japanese .pdf name', () => {
    const f = new File(['x'], '新生児および乳幼児のRSウイルス.pdf', {
      type: 'application/pdf',
    });
    expect(safeStorageKey(UUID_PREFIX, f).endsWith('.pdf')).toBe(true);
  });

  it('preserves .docx and .txt extensions, lowercased', () => {
    const docx = new File(['x'], 'これ以上.DOCX', { type: 'application/octet-stream' });
    const txt = new File(['x'], '予.TXT', { type: 'text/plain' });
    expect(safeStorageKey(UUID_PREFIX, docx).endsWith('.docx')).toBe(true);
    expect(safeStorageKey(UUID_PREFIX, txt).endsWith('.txt')).toBe(true);
  });

  it('never yields a double extension', () => {
    const f = new File(['x'], 'report.pdf', { type: 'application/pdf' });
    const key = safeStorageKey(UUID_PREFIX, f);
    expect((key.match(/\./g) ?? []).length).toBe(1);
  });

  it('drops a missing extension (no trailing dot)', () => {
    const f = new File(['x'], 'noextension', { type: 'text/plain' });
    const key = safeStorageKey(UUID_PREFIX, f);
    expect(key.includes('.')).toBe(false);
  });

  it('drops an odd/non-ASCII extension', () => {
    const f = new File(['x'], 'weird.タイプ', { type: 'text/plain' });
    const key = safeStorageKey(UUID_PREFIX, f);
    expect(key.includes('.')).toBe(false);
  });

  it('throws on a Japanese prefix', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(() => safeStorageKey('クライアント', f)).toThrow();
  });

  it('throws on prefixes with spaces, dot-segments, or a leading slash', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(() => safeStorageKey('has space', f)).toThrow();
    expect(() => safeStorageKey('..', f)).toThrow();
    expect(() => safeStorageKey('/leading', f)).toThrow();
  });

  it('accepts a UUID prefix', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    expect(() => safeStorageKey(UUID_PREFIX, f)).not.toThrow();
  });
});
