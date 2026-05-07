import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary text-text-primary p-8">
            <div className="glass-card p-8 text-center max-w-md animate-fade-in">
              <div className="text-4xl mb-4">💥</div>
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-text-secondary text-sm mb-6">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white font-medium transition-all hover:brightness-110"
              >
                Reload App
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
