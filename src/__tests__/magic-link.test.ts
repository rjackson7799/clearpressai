import { describe, it, expect } from 'vitest';
import {
  buildFeedbackUrl,
  isValidTokenFormat,
} from '../../supabase/functions/_shared/magic-link';

// 43 chars: 32 bytes base64-encoded with padding stripped.
const VALID_TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';

describe('isValidTokenFormat', () => {
  it('accepts a 43-char URL-safe base64 token', () => {
    expect(isValidTokenFormat(VALID_TOKEN)).toBe(true);
  });

  it('accepts dashes and underscores (URL-safe alphabet)', () => {
    const token = 'a-b_c'.padEnd(43, 'A');
    expect(isValidTokenFormat(token)).toBe(true);
  });

  it('rejects standard-base64 padding character "="', () => {
    expect(isValidTokenFormat('a'.repeat(42) + '=')).toBe(false);
  });

  it('rejects standard-base64 "+" and "/"', () => {
    expect(isValidTokenFormat('a'.repeat(42) + '+')).toBe(false);
    expect(isValidTokenFormat('a'.repeat(42) + '/')).toBe(false);
  });

  it('rejects wrong length (42 or 44)', () => {
    expect(isValidTokenFormat('a'.repeat(42))).toBe(false);
    expect(isValidTokenFormat('a'.repeat(44))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTokenFormat('')).toBe(false);
  });
});

describe('buildFeedbackUrl', () => {
  it('concatenates base + /f/ + token', () => {
    expect(buildFeedbackUrl('https://app.example.com', VALID_TOKEN)).toBe(
      `https://app.example.com/f/${VALID_TOKEN}`,
    );
  });

  it('strips trailing slash on base', () => {
    expect(buildFeedbackUrl('https://app.example.com/', VALID_TOKEN)).toBe(
      `https://app.example.com/f/${VALID_TOKEN}`,
    );
  });

  it('strips multiple trailing slashes', () => {
    expect(buildFeedbackUrl('https://app.example.com///', VALID_TOKEN)).toBe(
      `https://app.example.com/f/${VALID_TOKEN}`,
    );
  });

  it('throws on invalid token format', () => {
    expect(() => buildFeedbackUrl('https://app.example.com', 'short')).toThrow(
      'invalid_token_format',
    );
  });
});
