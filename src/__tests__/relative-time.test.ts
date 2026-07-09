import { describe, it, expect } from 'vitest';
import { relativeTime } from '@/lib/relative-time';

const now = new Date(2026, 6, 15, 12, 0, 0); // Jul 15 2026, 12:00 local
const at = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString();

describe('relativeTime', () => {
  it('returns em-dash for null / invalid input', () => {
    expect(relativeTime(null, now).en).toBe('—');
    expect(relativeTime(undefined, now).en).toBe('—');
    expect(relativeTime('not-a-date', now).en).toBe('—');
  });

  it('collapses sub-minute and future timestamps to "just now"', () => {
    expect(relativeTime(at(30_000), now).en).toBe('just now');
    expect(relativeTime(at(-5_000), now).en).toBe('just now'); // clock skew
    expect(relativeTime(at(10_000), now).ja).toBe('たった今');
  });

  it('minutes and hours within the same calendar day', () => {
    expect(relativeTime(at(5 * 60_000), now).en).toBe('5m ago');
    expect(relativeTime(at(5 * 60_000), now).ja).toBe('5分前');
    expect(relativeTime(at(3 * 3_600_000), now).en).toBe('3h ago');
    expect(relativeTime(at(3 * 3_600_000), now).ja).toBe('3時間前');
  });

  it('yesterday and multi-day', () => {
    expect(relativeTime(at(24 * 3_600_000), now).en).toBe('Yesterday');
    expect(relativeTime(at(24 * 3_600_000), now).ja).toBe('昨日');
    expect(relativeTime(at(3 * 86_400_000), now).en).toBe('3d ago');
    expect(relativeTime(at(3 * 86_400_000), now).ja).toBe('3日前');
  });

  it('falls back to a localized date beyond a week', () => {
    const res = relativeTime(at(10 * 86_400_000), now);
    expect(res.en).not.toMatch(/ago|Yesterday|just now/);
    expect(res.en.length).toBeGreaterThan(0);
    expect(res.ja).toMatch(/月.*日/);
  });
});
