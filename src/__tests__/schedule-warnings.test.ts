import { describe, it, expect } from 'vitest';
import {
  getSchedulingWarnings,
  getHoliday,
} from '@/lib/schedule-warnings';

// JST is UTC+09:00. A JST wall-clock time of "T" corresponds to UTC "T-9h".
// The composer converts the user's datetime-local input back to UTC with
// `${value}:00+09:00`, so the strings we feed here are the same shape the
// production RPC ultimately receives.

function jstUtc(jstWallclock: string): string {
  return new Date(`${jstWallclock}:00+09:00`).toISOString();
}

describe('getSchedulingWarnings', () => {
  it('returns no warnings for a JST business-hours weekday non-holiday', () => {
    // 2026-05-14 14:00 JST — a Thursday, not a holiday.
    expect(getSchedulingWarnings(jstUtc('2026-05-14T14:00'))).toEqual([]);
  });

  it('flags outside_business_hours before 09:00 JST', () => {
    expect(getSchedulingWarnings(jstUtc('2026-05-14T08:59'))).toContain(
      'outside_business_hours',
    );
  });

  it('flags outside_business_hours at exactly 18:00 JST', () => {
    // Boundary: 18:00 is OFF the clock per [09, 18) half-open interval.
    expect(getSchedulingWarnings(jstUtc('2026-05-14T18:00'))).toContain(
      'outside_business_hours',
    );
  });

  it('does NOT flag at exactly 09:00 JST (start of window inclusive)', () => {
    expect(getSchedulingWarnings(jstUtc('2026-05-14T09:00'))).toEqual([]);
  });

  it('does NOT flag at 17:59 JST (end of window exclusive)', () => {
    expect(getSchedulingWarnings(jstUtc('2026-05-14T17:59'))).toEqual([]);
  });

  it('flags japanese_holiday on 2026-05-03 (憲法記念日) even during business hours', () => {
    expect(getSchedulingWarnings(jstUtc('2026-05-03T14:00'))).toContain(
      'japanese_holiday',
    );
  });

  it('flags BOTH codes when sending on a holiday outside business hours', () => {
    const warnings = getSchedulingWarnings(jstUtc('2026-01-01T22:00'));
    expect(warnings).toContain('outside_business_hours');
    expect(warnings).toContain('japanese_holiday');
    expect(warnings).toHaveLength(2);
  });

  it('returns [] for null / empty / malformed input', () => {
    expect(getSchedulingWarnings(null)).toEqual([]);
    expect(getSchedulingWarnings(undefined)).toEqual([]);
    expect(getSchedulingWarnings('')).toEqual([]);
    expect(getSchedulingWarnings('not-a-date')).toEqual([]);
  });

  it('does not double-flag a holiday at 09:00 JST', () => {
    // 2026-01-01 (元日) at 09:00 JST: business-hours OK, holiday flag only.
    expect(getSchedulingWarnings(jstUtc('2026-01-01T09:00'))).toEqual([
      'japanese_holiday',
    ]);
  });
});

describe('getHoliday', () => {
  it('returns the matching holiday object for 2026-05-05', () => {
    const h = getHoliday(jstUtc('2026-05-05T10:00'));
    expect(h?.name_en).toBe("Children's Day");
    expect(h?.name_ja).toBe('こどもの日');
  });

  it('returns null on a non-holiday business day', () => {
    expect(getHoliday(jstUtc('2026-05-14T10:00'))).toBeNull();
  });

  it('returns null for nullish or malformed input', () => {
    expect(getHoliday(null)).toBeNull();
    expect(getHoliday(undefined)).toBeNull();
    expect(getHoliday('not-a-date')).toBeNull();
  });

  it('respects JST day boundary — late UTC time on 2026-04-29 still resolves to JST 2026-04-30', () => {
    // 2026-04-29T23:00 JST is a holiday (昭和の日).
    expect(getHoliday(jstUtc('2026-04-29T23:00'))?.name_ja).toBe('昭和の日');
    // 2026-04-30T00:00 JST (1 minute later than 23:59 the prior day) is not.
    expect(getHoliday(jstUtc('2026-04-30T00:00'))).toBeNull();
  });
});
