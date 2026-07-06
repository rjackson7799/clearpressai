import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { ErrorFallback } from "./ErrorFallback";

type Props = { children: ReactNode; variant?: "app" | "minimal" };
type State = { hasError: boolean };

/**
 * Top-level render-error boundary. Without this, any throw during render
 * (e.g. a malformed snapshot or unexpected null) white-screens the whole app.
 * Reports to Sentry when configured; captureException no-ops otherwise.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback variant={this.props.variant ?? "app"} />;
    }
    return this.props.children;
  }
}
