// External error messages surfaced by the public feedback-load /
// feedback-submit Edge Functions. The Edge Functions deliberately collapse
// every token-side gate (format_mismatch / not_found / expired /
// chosen_variant_invalid / xor) to opaque 'token_invalid' to keep
// timing + content side-channels closed against token-namespace probing.
// The granular reason lives in the server log; the public page only ever
// sees 'token_invalid' (and 5xx for genuine failures).
//
// Same pattern as Phase 5 delivery-errors.ts — codes -> {ja, en} record
// rendered via BilingualLabel. Server-side strings are authoritative; if a
// new gate is added without an entry here, the raw code string falls through.

const FEEDBACK_MESSAGES: Record<string, { ja: string; en: string }> = {
  token_invalid: {
    ja: 'このリンクは無効です。期限切れか、すでに使用された可能性があります。',
    en: 'This link is no longer valid — it may have expired or already been used.',
  },
  // Surfaced inline by Edge Function or supabase-js when the user has no
  // network connectivity / function is down. Keep the message empathetic.
  network_error: {
    ja: 'ネットワークエラーが発生しました。時間をおいて再度お試しください。',
    en: 'A network error occurred. Please try again in a moment.',
  },
};

export function explainFeedbackError(
  message: string,
): { ja: string; en: string } {
  for (const key of Object.keys(FEEDBACK_MESSAGES)) {
    if (message.includes(key)) return FEEDBACK_MESSAGES[key];
  }
  // Generic fallback so the page never renders a raw stack-trace string to
  // an end-user client. Internal log captures the real message.
  return {
    ja: '送信中にエラーが発生しました。時間をおいて再度お試しください。',
    en: 'Something went wrong. Please try again in a moment.',
  };
}
