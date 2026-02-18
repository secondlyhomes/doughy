/**
 * Async Error Boundary
 *
 * Boundary for async operations that automatically resets on retry.
 */

import React, { ReactNode, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
  autoResetDelay?: number;
}

export function AsyncErrorBoundary({
  children,
  onError,
  autoResetDelay = 3000,
}: AsyncErrorBoundaryProps): JSX.Element {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ErrorBoundary
      resetKeys={[resetKey]}
      onError={(error) => {
        onError?.(error);
        setTimeout(() => setResetKey((k) => k + 1), autoResetDelay);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
