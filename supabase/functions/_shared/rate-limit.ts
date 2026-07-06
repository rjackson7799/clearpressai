import type { SupabaseClient } from '@supabase/supabase-js';

/** Best-effort client IP from the platform proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Sliding-window rate check via the check_rate_limit RPC (service_role).
 *
 * Returns true when the request is WITHIN limits (allow), false when it should
 * be blocked. Fails OPEN on any error — a rate-limit outage (or a not-yet-
 * applied migration) must never take down the public feedback flow. Wrapped so
 * it can never throw into the caller.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_bucket: bucket,
      p_identifier: identifier,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn(`rate_limit check failed (${bucket}); allowing: ${error.message}`);
      return true;
    }
    return data === true;
  } catch (e) {
    console.warn(
      `rate_limit check threw (${bucket}); allowing: ${e instanceof Error ? e.message : String(e)}`,
    );
    return true;
  }
}
