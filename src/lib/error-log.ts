/**
 * ClearPress AI - Centralized Error Log Store
 *
 * Module-level ring buffer for capturing errors from:
 * - React error boundaries (render errors)
 * - Global error handler (runtime errors, unhandled rejections)
 * - Console.error interception (dev only)
 *
 * Compatible with React's useSyncExternalStore for reactive subscriptions.
 */

// ===== Types =====

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  type: 'render' | 'unhandled-rejection' | 'runtime' | 'network' | 'console';
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  meta?: Record<string, unknown>;
}

// ===== Module State =====

const MAX_ENTRIES = 50;
let entries: ErrorLogEntry[] = [];
let snapshot: readonly ErrorLogEntry[] = Object.freeze([]);
const listeners = new Set<() => void>();

function emitChange() {
  snapshot = Object.freeze([...entries]);
  listeners.forEach((listener) => listener());
}

// ===== Public API =====

/**
 * Log an error to the centralized store.
 * Can be called from anywhere — React components, global handlers, services.
 */
export function logError(
  entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>
): void {
  const newEntry: ErrorLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  entries = [...entries, newEntry];

  // Ring buffer: drop oldest entries when exceeding capacity
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(entries.length - MAX_ENTRIES);
  }

  emitChange();
}

/**
 * Get all current error log entries.
 */
export function getErrorLog(): readonly ErrorLogEntry[] {
  return snapshot;
}

/**
 * Clear the error log.
 */
export function clearErrorLog(): void {
  entries = [];
  emitChange();
}

// ===== useSyncExternalStore compatibility =====

/**
 * Subscribe to error log changes.
 * Returns an unsubscribe function.
 */
export function subscribeErrorLog(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Get the current snapshot for useSyncExternalStore.
 */
export function getErrorLogSnapshot(): readonly ErrorLogEntry[] {
  return snapshot;
}
