import { describe, it, expect } from "vitest";
import tsSrc from "./canonical-payload.ts?raw";
import denoSrc from "../../supabase/functions/_shared/canonical.ts?raw";

// Drift guard for the canonicalize() helper. The Deno copy in
// _shared/canonical.ts is authoritative for sign-audit-report HMAC input;
// any divergence in this region produces signatures that won't verify
// against the Deno re-canonicalization at verify-audit-signature time.
function extractDriftRegion(src: string, name: string): string {
  const re = new RegExp(
    `// drift:start ${name}\\r?\\n([\\s\\S]*?)\\r?\\n// drift:end ${name}`,
  );
  const match = src.match(re);
  if (!match) {
    throw new Error(`Could not locate drift region "${name}" in source`);
  }
  return match[1];
}

describe("canonical-payload drift (TS mirror vs Deno _shared/canonical.ts)", () => {
  it("CANONICALIZE region is byte-identical across both files", () => {
    const ts = extractDriftRegion(tsSrc, "CANONICALIZE");
    const deno = extractDriftRegion(denoSrc, "CANONICALIZE");
    expect(deno).toBe(ts);
  });
});
