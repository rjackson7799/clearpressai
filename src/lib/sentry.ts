import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry only when a DSN is present. Absent DSN (local dev, tests,
 * or an un-provisioned deploy) leaves Sentry fully disabled — captureException
 * then no-ops, so the ErrorBoundary and window handlers stay safe to call.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Conservative sampling for a single-firm internal tool; raise if needed.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
