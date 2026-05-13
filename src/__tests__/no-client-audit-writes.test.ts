import { describe, it, expect } from "vitest";

// I1 enforcement: browser code MUST NOT insert directly into audit_trail_events
// or audit_signatures. Every audit-bearing client action goes through an RPC
// (approve_variant, apply_fix, acknowledge_finding, etc.) so the audit event
// is written inside the same PL/pgSQL transaction. This grep walk fails the
// build when a regression introduces a direct table write from the React side.

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\.from\(\s*['"]audit_trail_events['"]\s*\)\s*\.\s*(insert|upsert)\b/,
  /\.from\(\s*['"]audit_signatures['"]\s*\)\s*\.\s*(insert|upsert)\b/,
];

// Eager glob: vitest evaluates this at test load time. Excludes this file
// itself and the read-only display module (which contains no inserts).
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const EXCLUDE_PATHS = new Set<string>([
  "/src/__tests__/no-client-audit-writes.test.ts",
]);

describe("I1 — no client-side audit writes", () => {
  it("rejects .from('audit_trail_events').insert in src/", () => {
    const offenders: { file: string; snippet: string }[] = [];
    for (const [file, text] of Object.entries(sources)) {
      if (EXCLUDE_PATHS.has(file)) continue;
      for (const re of FORBIDDEN_PATTERNS) {
        const match = text.match(re);
        if (match) offenders.push({ file, snippet: match[0] });
      }
    }
    if (offenders.length > 0) {
      const summary = offenders
        .map((o) => `  ${o.file}: ${o.snippet}`)
        .join("\n");
      throw new Error(
        `Direct client-side audit-table writes detected:\n${summary}\n` +
          `Route the write through a PL/pgSQL RPC instead (see migration 0005).`,
      );
    }
    expect(offenders).toHaveLength(0);
  });
});
