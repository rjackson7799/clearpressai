/**
 * ClearPress AI - Global Error Handler
 *
 * Installs global listeners for uncaught errors and unhandled promise rejections.
 * Must be called once from main.tsx before React mounts.
 *
 * In dev mode, also patches console.error to capture errors into the log
 * and shows toast notifications for global errors.
 */

import { logError } from './error-log';

/**
 * Install global error capturing handlers.
 * Call this once before createRoot() in main.tsx.
 */
export function installGlobalErrorHandler(): void {
  // 1. Catch synchronous runtime errors
  window.onerror = (message, source, lineno, colno, error) => {
    logError({
      type: 'runtime',
      message: typeof message === 'string' ? message : 'Unknown error',
      stack: error?.stack,
      source: source ? `${source}:${lineno}:${colno}` : undefined,
    });

    // Show toast in dev mode (sonner toast works if <Toaster> is mounted)
    if (import.meta.env.DEV) {
      // Dynamic import to avoid circular deps and keep this module lightweight
      import('sonner').then(({ toast }) => {
        toast.error(`Runtime Error: ${typeof message === 'string' ? message : 'Unknown'}`);
      });
    }
  };

  // 2. Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    logError({
      type: 'unhandled-rejection',
      message: error?.message ?? String(error),
      stack: error?.stack,
    });

    if (import.meta.env.DEV) {
      import('sonner').then(({ toast }) => {
        toast.error(`Unhandled Promise: ${error?.message ?? String(error)}`);
      });
    }
  });

  // 3. Patch console.error to capture logged errors (dev only)
  if (import.meta.env.DEV) {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      // Call original first so browser dev tools still show the error
      originalConsoleError.apply(console, args);

      const message = args
        .map((a) =>
          a instanceof Error
            ? a.message
            : typeof a === 'string'
              ? a
              : JSON.stringify(a)
        )
        .join(' ');

      logError({
        type: 'console',
        message,
        stack: (args.find((a) => a instanceof Error) as Error | undefined)
          ?.stack,
      });
    };
  }
}
