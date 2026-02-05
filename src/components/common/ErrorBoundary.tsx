/**
 * ClearPress AI - Error Boundary Components
 *
 * Two levels of error boundaries:
 * - AppErrorBoundary: wraps entire app, catches catastrophic crashes
 * - RouteErrorBoundary: wraps each lazy-loaded page, keeps sidebar/header intact
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logError } from '@/lib/error-log';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ===== Types =====

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: 'app' | 'route';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ===== Error Boundary Class Component =====

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError({
      type: 'render',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback === 'app') {
        return (
          <AppErrorFallback
            error={this.state.error}
            onReset={this.handleReset}
          />
        );
      }
      return (
        <RouteErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

// ===== App-Level Fallback (hardcoded Japanese — contexts may be broken) =====

function AppErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            エラーが発生しました
          </h1>
          <p className="text-sm text-muted-foreground">
            予期しないエラーが発生しました。再読み込みをお試しください。
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            再読み込み
          </button>
          <button
            onClick={() => {
              onReset();
              window.location.href = '/';
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            ダッシュボードへ
          </button>
        </div>

        {import.meta.env.DEV && error && (
          <details className="text-left text-xs bg-muted/50 rounded-lg p-4 mt-4">
            <summary className="cursor-pointer text-muted-foreground font-medium">
              エラー詳細 (開発者向け)
            </summary>
            <pre className="mt-2 overflow-auto max-h-48 text-destructive/80 whitespace-pre-wrap break-words">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ===== Route-Level Fallback (inline, keeps layout intact) =====

function RouteErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            このページでエラーが発生しました
          </h2>
          <p className="text-sm text-muted-foreground">
            問題が発生しました。再試行するか、ダッシュボードに戻ってください。
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            再試行
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            ダッシュボードへ
          </button>
        </div>

        {import.meta.env.DEV && error && (
          <details className="text-left text-xs bg-muted/50 rounded-lg p-3 mt-2">
            <summary className="cursor-pointer text-muted-foreground font-medium">
              エラー詳細 (開発者向け)
            </summary>
            <pre className="mt-2 overflow-auto max-h-36 text-destructive/80 whitespace-pre-wrap break-words">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ===== Convenience Exports =====

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback="app">{children}</ErrorBoundary>;
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback="route">{children}</ErrorBoundary>;
}
