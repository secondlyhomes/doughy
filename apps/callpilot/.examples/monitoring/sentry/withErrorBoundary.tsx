/**
 * Higher-Order Component for Error Boundary
 *
 * Wraps any component with error boundary functionality.
 *
 * @example
 * ```tsx
 * const SafeScreen = withErrorBoundary(MyScreen, {
 *   errorMessage: 'Failed to load screen',
 * });
 * ```
 */

import React from 'react';

import { ErrorBoundary } from './ErrorBoundary';
import { ErrorBoundaryProps } from './types';

/**
 * HOC to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  return function WrappedWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
