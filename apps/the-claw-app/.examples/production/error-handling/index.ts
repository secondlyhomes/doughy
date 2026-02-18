/**
 * Error Handling Module
 *
 * Provides error boundaries, storage, and recovery utilities.
 *
 * Usage:
 * ```tsx
 * import { ErrorBoundary, ErrorStorage, ErrorRecovery } from './error-handling';
 *
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */

// Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { ErrorFallback } from './components/ErrorFallback';
export { FeatureErrorBoundary } from './components/FeatureErrorBoundary';
export { AsyncErrorBoundary } from './components/AsyncErrorBoundary';

// Utilities
export { ErrorStorage } from './utils/error-storage';
export { ErrorRecovery } from './utils/error-recovery';

// Types
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorReport,
  ErrorFallbackProps,
  RecoveryOptions,
} from './types/error-types';
