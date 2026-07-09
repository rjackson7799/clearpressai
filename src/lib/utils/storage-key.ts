/**
 * Build a Supabase Storage object key that is guaranteed ASCII-safe.
 *
 * Supabase Storage rejects keys containing non-ASCII characters (kana/kanji,
 * the `・` middle-dot, etc.) with `400 Invalid key`. Never put a raw filename
 * in a key — key by UUID and keep the human-readable name in a DB column.
 * The extension is preserved (lowercased) only when it is plain alphanumeric.
 *
 * The `prefix` is validated too, so a future caller can't reintroduce the bug
 * by passing an unsafe path segment.
 */
export function safeStorageKey(prefix: string, file: File): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(prefix)) {
    throw new Error(`Unsafe storage key prefix: ${prefix}`);
  }
  const match = /\.([A-Za-z0-9]+)$/.exec(file.name);
  const ext = match ? `.${match[1].toLowerCase()}` : '';
  return `${prefix}/${crypto.randomUUID()}${ext}`;
}
