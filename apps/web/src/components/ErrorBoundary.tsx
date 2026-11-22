import { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureError } from '../lib/monitoring';

interface Props {
  children: ReactNode;
  /** Changing this value resets the boundary (e.g. pass the current route path). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ color: 'var(--t1)' }}
      >
        <img src="/TM-Alert-negro.svg" alt="" className="h-10 w-10 opacity-70" style={{ filter: 'invert(1)' }} />
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm" style={{ color: 'var(--t3)' }}>
          An unexpected error occurred in this section. It has been reported. Try reloading the page.
        </p>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
