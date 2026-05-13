import { describe, it, expect } from 'vitest';
import {
  ALLOWED_MIME_TYPES,
  FileExtractionError,
  MAX_FILE_BYTES,
  MIN_USABLE_CHARS,
  extractTextFromFile,
  validateFile,
} from './file-extraction';

describe('validateFile', () => {
  it('accepts a small .txt file', () => {
    const f = new File(['hello'], 'a.txt', { type: 'text/plain' });
    expect(() => validateFile(f)).not.toThrow();
  });

  it('accepts an application/pdf MIME', () => {
    const f = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'a.pdf', {
      type: 'application/pdf',
    });
    expect(() => validateFile(f)).not.toThrow();
  });

  it('rejects an image/png file with code unsupported_mime', () => {
    const f = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', {
      type: 'image/png',
    });
    try {
      validateFile(f);
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(FileExtractionError);
      expect((e as FileExtractionError).code).toBe('unsupported_mime');
    }
  });

  it('rejects a >10 MB file with code file_too_large', () => {
    const oversize = new Uint8Array(MAX_FILE_BYTES + 1);
    const f = new File([oversize], 'big.txt', { type: 'text/plain' });
    try {
      validateFile(f);
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(FileExtractionError);
      expect((e as FileExtractionError).code).toBe('file_too_large');
    }
  });
});

describe('extractTextFromFile', () => {
  it('extracts text from a text/plain file and reports char count', async () => {
    const body = 'これはサンプル本文です。\nLine two.';
    const f = new File([body], 'sample.txt', { type: 'text/plain' });
    const result = await extractTextFromFile(f);
    expect(result.text).toBe(body);
    expect(result.chars).toBe(body.length);
  });

  it('throws unsupported_mime when given an unrecognized MIME', async () => {
    const f = new File(['x'], 'a.xyz', { type: 'application/octet-stream' });
    await expect(extractTextFromFile(f)).rejects.toMatchObject({
      code: 'unsupported_mime',
    });
  });
});

describe('constants', () => {
  it('MIN_USABLE_CHARS is 500 (the readiness-gate threshold)', () => {
    expect(MIN_USABLE_CHARS).toBe(500);
  });

  it('MAX_FILE_BYTES matches the 10 MB Storage bucket limit', () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('ALLOWED_MIME_TYPES exactly mirrors the Storage bucket allowlist', () => {
    expect([...ALLOWED_MIME_TYPES]).toEqual([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]);
  });
});
