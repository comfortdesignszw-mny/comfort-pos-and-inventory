import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre>{(this as any).state.error?.toString()}</pre>
          <pre>{(this as any).state.error?.stack}</pre>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
