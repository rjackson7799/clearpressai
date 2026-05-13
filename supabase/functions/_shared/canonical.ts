/**
 * Deterministic JSON canonicalization + HMAC-SHA-256 used by
 * sign-audit-report and verify-audit-signature.
 *
 * Both endpoints MUST produce byte-identical output from canonicalize()
 * for the same value, otherwise the HMAC computed at sign-time won't
 * match the HMAC re-computed at verify-time and the signature would
 * appear forged. The drift-guard test in T11 (src/lib/canonical-payload
 * mirror + .sync.test.ts) compares this file's function bodies to the
 * TS mirror via the `drift:start CANONICALIZE` / `drift:end CANONICALIZE`
 * sentinels.
 */

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

export async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
