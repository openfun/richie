import { Component, PropsWithChildren, ReactNode } from 'react';
import { handle } from 'utils/errors/handle';

/**
 * Component in charge to catch error raised by its children.
 *
 * For more information : http://reactjs.org/docs/error-boundaries.html
 */
class ErrorBoundary extends Component<
  PropsWithChildren<{ fallback?: ReactNode }>,
  { hasError: boolean }
> {
  constructor(props: PropsWithChildren<void>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    handle(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
