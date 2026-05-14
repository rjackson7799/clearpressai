import holidays2026 from '@/lib/holidays-2026.json';
import type { SchedulingWarning } from '@/lib/types/delivery';

interface Holiday {
  date: string;
  name_ja: string;
  name_en: string;
}

const HOLIDAY_MAP: Map<string, Holiday> = new Map(
  (holidays2026 as Holiday[]).map((h) => [h.date, h]),
);

// Returns warning codes for a UTC ISO timestamp interpreted in JST. Business
// hours per PRD §5.4 are widened to [09, 18) — the strict 22:00–06:00 quiet
// window is implied by the wider off-hours flag. Holidays sourced from the
// hardcoded src/lib/holidays-2026.json (v2 swaps to a maintained library).
export function getSchedulingWarnings(utcIso: string | null | undefined): SchedulingWarning[] {
  if (!utcIso) return [];
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return [];
  const jstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  const warnings: SchedulingWarning[] = [];
  const hour = jst.getUTCHours();
  if (hour < 9 || hour >= 18) {
    warnings.push('outside_business_hours');
  }
  const dateStr = jst.toISOString().slice(0, 10);
  if (HOLIDAY_MAP.has(dateStr)) {
    warnings.push('japanese_holiday');
  }
  return warnings;
}

export function getHoliday(utcIso: string | null | undefined): Holiday | null {
  if (!utcIso) return null;
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return null;
  const jstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const dateStr = new Date(jstMs).toISOString().slice(0, 10);
  return HOLIDAY_MAP.get(dateStr) ?? null;
}
