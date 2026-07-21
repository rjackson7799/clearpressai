import { describe, it, expect, vi, afterEach } from 'vitest';
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

  // Hardening: build from origin so a base carrying a stray path can't produce
  // /f/f/<token>. See the ".../f" misconfig that 404'd a real feedback link.
  describe('base normalization (misconfig guard)', () => {
    afterEach(() => vi.restoreAllMocks());

    it('tolerates a legacy trailing "/f" base without doubling', () => {
      expect(buildFeedbackUrl('https://app.example.com/f', VALID_TOKEN)).toBe(
        `https://app.example.com/f/${VALID_TOKEN}`,
      );
    });

    it('tolerates a legacy "/f/" base (trailing slash)', () => {
      expect(buildFeedbackUrl('https://app.example.com/f/', VALID_TOKEN)).toBe(
        `https://app.example.com/f/${VALID_TOKEN}`,
      );
    });

    it('tolerates multiple trailing slashes after /f', () => {
      expect(buildFeedbackUrl('https://app.example.com/f///', VALID_TOKEN)).toBe(
        `https://app.example.com/f/${VALID_TOKEN}`,
      );
    });

    it('ignores a query string and fragment on the base', () => {
      expect(
        buildFeedbackUrl('https://app.example.com/f?ref=1#top', VALID_TOKEN),
      ).toBe(`https://app.example.com/f/${VALID_TOKEN}`);
    });

    it('drops an unexpected path and warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(buildFeedbackUrl('https://app.example.com/app', VALID_TOKEN)).toBe(
        `https://app.example.com/f/${VALID_TOKEN}`,
      );
      expect(warn).toHaveBeenCalledOnce();
    });

    it('normalizes an uppercase /F to the origin (warns; route is lowercase)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(buildFeedbackUrl('https://app.example.com/F', VALID_TOKEN)).toBe(
        `https://app.example.com/f/${VALID_TOKEN}`,
      );
      expect(warn).toHaveBeenCalledOnce();
    });

    it('preserves a localhost dev origin with a port', () => {
      expect(buildFeedbackUrl('http://localhost:5173', VALID_TOKEN)).toBe(
        `http://localhost:5173/f/${VALID_TOKEN}`,
      );
    });

    it('throws invalid_feedback_base on a malformed base', () => {
      expect(() => buildFeedbackUrl('not a url', VALID_TOKEN)).toThrow(
        'invalid_feedback_base',
      );
    });

    it('throws invalid_feedback_base on a non-http(s) scheme', () => {
      expect(() => buildFeedbackUrl('ftp://app.example.com', VALID_TOKEN)).toThrow(
        'invalid_feedback_base',
      );
    });
  });
});
