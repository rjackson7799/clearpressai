/**
 * ClearPress AI - Dev Diagnostics Panel
 *
 * Development-only floating panel for debugging app state.
 * NOT included in production builds (conditionally imported in App.tsx).
 *
 * Features:
 * - Error log viewer
 * - TanStack Query cache inspector
 * - Auth state viewer
 * - Performance metrics
 *
 * Toggle: click bug icon or Ctrl+Shift+D
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bug,
  X,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Clock,
  User,
  Activity,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorLog } from '@/hooks/use-error-log';
import type { ErrorLogEntry } from '@/lib/error-log';

// ===== Types =====

type TabId = 'errors' | 'queries' | 'auth' | 'perf';

interface QueryInfo {
  key: string;
  status: 'pending' | 'error' | 'success';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  isStale: boolean;
  errorMessage?: string;
  dataUpdatedAt: number;
}

// ===== Tab Config =====

const TABS: { id: TabId; label: string; icon: typeof AlertCircle }[] = [
  { id: 'errors', label: 'Errors', icon: AlertCircle },
  { id: 'queries', label: 'Queries', icon: Activity },
  { id: 'auth', label: 'Auth', icon: User },
  { id: 'perf', label: 'Perf', icon: Clock },
];

// ===== Helpers =====

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getTypeBadgeClasses(type: ErrorLogEntry['type']): string {
  switch (type) {
    case 'render':
      return 'bg-red-500/20 text-red-300';
    case 'unhandled-rejection':
      return 'bg-orange-500/20 text-orange-300';
    case 'runtime':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'console':
      return 'bg-gray-500/20 text-gray-300';
    case 'network':
      return 'bg-blue-500/20 text-blue-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

// ===== Main Component =====

export default function DevDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('errors');
  const { entries, clearLog, errorCount } = useErrorLog();

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] h-10 w-10 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors border border-gray-700"
        title="Dev Diagnostics (Ctrl+Shift+D)"
      >
        <Bug className="h-5 w-5" />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {errorCount > 9 ? '9+' : errorCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[9999] w-[420px] max-h-[60vh] bg-gray-950/95 backdrop-blur-sm text-gray-100 rounded-lg shadow-2xl border border-gray-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Dev Diagnostics</span>
              <OnlineIndicator />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-blue-500 bg-gray-900/50'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.id === 'errors' && errorCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                      {errorCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'errors' && (
              <ErrorsTab entries={entries} onClear={clearLog} />
            )}
            {activeTab === 'queries' && <QueriesTab />}
            {activeTab === 'auth' && <AuthTab />}
            {activeTab === 'perf' && <PerfTab />}
          </div>
        </div>
      )}
    </>
  );
}

// ===== Online Indicator =====

function OnlineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <span
      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
        isOnline
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {isOnline ? (
        <Wifi className="h-2.5 w-2.5" />
      ) : (
        <WifiOff className="h-2.5 w-2.5" />
      )}
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

// ===== Errors Tab =====

function ErrorsTab({
  entries,
  onClear,
}: {
  entries: readonly ErrorLogEntry[];
  onClear: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
        <p className="text-sm">No errors captured</p>
      </div>
    );
  }

  return (
    <div>
      {/* Clear button */}
      <div className="flex justify-end px-3 py-1.5 border-b border-gray-800/50">
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      {/* Error entries (newest first) */}
      <div className="divide-y divide-gray-800/50">
        {[...entries].reverse().map((entry) => (
          <div key={entry.id} className="px-3 py-2">
            <button
              onClick={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              className="w-full text-left"
            >
              <div className="flex items-start gap-2">
                {expandedId === entry.id ? (
                  <ChevronDown className="h-3 w-3 mt-0.5 shrink-0 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-gray-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadgeClasses(entry.type)}`}
                    >
                      {entry.type}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">
                    {entry.message}
                  </p>
                </div>
              </div>
            </button>

            {expandedId === entry.id && entry.stack && (
              <pre className="mt-2 ml-5 text-[10px] text-gray-500 bg-gray-900/50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                {entry.stack}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Queries Tab =====

function QueriesTab() {
  const queryClient = useQueryClient();
  const [, setTick] = useState(0);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Refresh query state periodically
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const queries: QueryInfo[] = useMemo(() => {
    return queryClient
      .getQueryCache()
      .getAll()
      .map((query) => ({
        key: JSON.stringify(query.queryKey),
        status: query.state.status,
        fetchStatus: query.state.fetchStatus,
        isStale: query.isStale(),
        errorMessage:
          query.state.status === 'error'
            ? (query.state.error as Error)?.message
            : undefined,
        dataUpdatedAt: query.state.dataUpdatedAt,
      }))
      .sort((a, b) => {
        // Errors first, then fetching, then stale, then fresh
        const priority = (q: QueryInfo) => {
          if (q.status === 'error') return 0;
          if (q.fetchStatus === 'fetching') return 1;
          if (q.isStale) return 2;
          return 3;
        };
        return priority(a) - priority(b);
      });
  }, [queryClient, /* eslint-disable-line react-hooks/exhaustive-deps */ setTick]);

  const stats = useMemo(() => {
    let loading = 0,
      error = 0,
      stale = 0,
      fresh = 0;
    queries.forEach((q) => {
      if (q.fetchStatus === 'fetching') loading++;
      else if (q.status === 'error') error++;
      else if (q.isStale) stale++;
      else fresh++;
    });
    return { loading, error, stale, fresh, total: queries.length };
  }, [queries]);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-400">{stats.total} queries</span>
          {stats.loading > 0 && (
            <span className="text-blue-400">{stats.loading} loading</span>
          )}
          {stats.error > 0 && (
            <span className="text-red-400">{stats.error} error</span>
          )}
          {stats.stale > 0 && (
            <span className="text-yellow-400">{stats.stale} stale</span>
          )}
          <span className="text-green-400">{stats.fresh} fresh</span>
        </div>
        <button
          onClick={refresh}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-3 w-3 text-gray-500" />
        </button>
      </div>

      {/* Query list */}
      <div className="divide-y divide-gray-800/50">
        {queries.map((query) => (
          <div key={query.key} className="px-3 py-1.5">
            <button
              onClick={() =>
                setExpandedKey(expandedKey === query.key ? null : query.key)
              }
              className="w-full text-left flex items-center gap-2"
            >
              <QueryStatusIcon query={query} />
              <span className="text-[11px] text-gray-300 truncate flex-1 font-mono">
                {query.key}
              </span>
            </button>

            {expandedKey === query.key && (
              <div className="mt-1 ml-5 text-[10px] text-gray-500 space-y-0.5">
                <p>
                  Status: {query.status} / {query.fetchStatus}
                </p>
                <p>Stale: {query.isStale ? 'yes' : 'no'}</p>
                {query.dataUpdatedAt > 0 && (
                  <p>Updated: {formatTime(query.dataUpdatedAt)}</p>
                )}
                {query.errorMessage && (
                  <p className="text-red-400">Error: {query.errorMessage}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {queries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Activity className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">No active queries</p>
        </div>
      )}
    </div>
  );
}

function QueryStatusIcon({ query }: { query: QueryInfo }) {
  if (query.fetchStatus === 'fetching') {
    return <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />;
  }
  if (query.status === 'error') {
    return <XCircle className="h-3 w-3 text-red-400 shrink-0" />;
  }
  if (query.isStale) {
    return (
      <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
    );
  }
  return <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />;
}

// ===== Auth Tab =====

function AuthTab() {
  const { user, profile, role, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="px-3 py-2 space-y-2">
      <InfoRow label="Authenticated" value={isAuthenticated ? 'Yes' : 'No'} />
      <InfoRow label="Loading" value={isLoading ? 'Yes' : 'No'} />
      <InfoRow label="Role" value={role ?? '—'} />
      <InfoRow label="User ID" value={user?.id?.slice(0, 8) + '...' || '—'} />
      <InfoRow label="Email" value={user?.email ?? '—'} />
      <InfoRow label="Name" value={profile?.name ?? '—'} />
      <InfoRow
        label="Organization"
        value={profile?.organization_id?.slice(0, 8) + '...' || '—'}
      />
      <InfoRow label="Route" value={window.location.pathname} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-mono text-[11px]">{value}</span>
    </div>
  );
}

// ===== Performance Tab =====

function PerfTab() {
  const metrics = useMemo(() => {
    const navEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    const nav = navEntries[0];

    const resourceEntries = performance.getEntriesByType('resource');

    // Memory info (Chrome only)
    const mem = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;

    return {
      domContentLoaded: nav
        ? Math.round(nav.domContentLoadedEventEnd - nav.startTime)
        : null,
      loadEvent: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      domInteractive: nav
        ? Math.round(nav.domInteractive - nav.startTime)
        : null,
      resourceCount: resourceEntries.length,
      memoryUsed: mem
        ? `${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB`
        : '—',
      memoryTotal: mem
        ? `${Math.round(mem.totalJSHeapSize / 1024 / 1024)}MB`
        : '—',
      memoryLimit: mem
        ? `${Math.round(mem.jsHeapSizeLimit / 1024 / 1024)}MB`
        : '—',
    };
  }, []);

  return (
    <div className="px-3 py-2 space-y-2">
      <InfoRow
        label="DOM Content Loaded"
        value={metrics.domContentLoaded ? `${metrics.domContentLoaded}ms` : '—'}
      />
      <InfoRow
        label="Load Event"
        value={metrics.loadEvent ? `${metrics.loadEvent}ms` : '—'}
      />
      <InfoRow
        label="DOM Interactive"
        value={metrics.domInteractive ? `${metrics.domInteractive}ms` : '—'}
      />
      <InfoRow
        label="Resources Loaded"
        value={String(metrics.resourceCount)}
      />

      <div className="border-t border-gray-800/50 pt-2 mt-2">
        <p className="text-[10px] text-gray-600 mb-1.5">
          Memory (Chrome only)
        </p>
        <InfoRow label="Used" value={metrics.memoryUsed} />
        <InfoRow label="Allocated" value={metrics.memoryTotal} />
        <InfoRow label="Limit" value={metrics.memoryLimit} />
      </div>

      <div className="border-t border-gray-800/50 pt-2 mt-2">
        <InfoRow label="Current Route" value={window.location.pathname} />
        <InfoRow
          label="User Agent"
          value={navigator.userAgent.slice(0, 40) + '...'}
        />
      </div>
    </div>
  );
}
