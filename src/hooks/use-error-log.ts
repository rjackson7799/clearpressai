/**
 * ClearPress AI - Error Log Hook
 *
 * Reactive hook for subscribing to the centralized error log.
 * Uses useSyncExternalStore for efficient updates.
 */

import { useSyncExternalStore } from 'react';
import {
  getErrorLogSnapshot,
  subscribeErrorLog,
  clearErrorLog,
} from '@/lib/error-log';

export function useErrorLog() {
  const entries = useSyncExternalStore(subscribeErrorLog, getErrorLogSnapshot);

  return {
    entries,
    clearLog: clearErrorLog,
    errorCount: entries.length,
  };
}
