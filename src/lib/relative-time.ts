/**
 * Calendar-aware relative time for the recent-projects "Updated" column.
 * Pure — `now` is passed in (never `new Date()` in render; see the
 * `react-hooks/purity` rule). Returns a bilingual pair so the caller renders
 * the active language via <BilingualLabel> / pickLang.
 *
 * Buckets: just now · Nm ago · Nh ago (same calendar day) · Yesterday ·
 * Nd ago (< 7 days) · localized date (older). Null → "—".
 */
function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function relativeTime(
  iso: string | null | undefined,
  now: Date,
): { ja: string; en: string } {
  if (!iso) return { ja: '—', en: '—' };
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return { ja: '—', en: '—' };

  const diffMs = now.getTime() - then.getTime();
  // Future timestamps (clock skew) collapse to "just now" rather than "-3m".
  if (diffMs < 60_000) return { ja: 'たった今', en: 'just now' };

  const dayDiff = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(then)) / 86_400_000,
  );

  if (dayDiff <= 0) {
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return { ja: `${mins}分前`, en: `${mins}m ago` };
    const hours = Math.floor(diffMs / 3_600_000);
    return { ja: `${hours}時間前`, en: `${hours}h ago` };
  }
  if (dayDiff === 1) return { ja: '昨日', en: 'Yesterday' };
  if (dayDiff < 7) return { ja: `${dayDiff}日前`, en: `${dayDiff}d ago` };

  return {
    ja: then.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    en: then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}
