'use client';

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card pixel-border-lg p-8 max-w-md text-center">
              <h1 className="text-2xl font-pixel text-destructive mb-4">Oops! Something went wrong</h1>
              <p className="text-muted-foreground text-sm mb-6">
                {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 pixel-border font-pixel text-sm transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

