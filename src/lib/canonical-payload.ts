// TS mirror of supabase/functions/_shared/canonical.ts canonicalize(). The
// Deno function is authoritative for sign-audit-report; this mirror exists
// so vitest can prove byte-equivalence on every commit via the
// canonical-payload.sync.test drift guard, and so client code can compute
// the same canonical string when needed (currently only verify reads the
// stored canonical_payload back -- no client recomputation today, but the
// mirror is here for tests and any future ops tooling).

// drift:start CANONICALIZE
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
}
// drift:end CANONICALIZE
