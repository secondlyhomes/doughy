/**
 * Error Boundary with Sentry Integration
 *
 * @example
 * ```tsx
 * import { ErrorBoundary, withErrorBoundary } from './sentry';
 *
 * // Direct usage
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // HOC usage
 * const SafeScreen = withErrorBoundary(MyScreen);
 * ```
 */

// Main component
export { ErrorBoundary } from './ErrorBoundary';

// HOC
export { withErrorBoundary } from './withErrorBoundary';

// Fallback UI (for custom compositions)
export { ErrorFallback } from './ErrorFallback';

// Types
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
} from './types';
