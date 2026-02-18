/**
 * Types for Error Boundary with Sentry Integration
 */

import { ErrorInfo, ReactNode } from 'react';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI component */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details in fallback UI (for development) */
  showDetails?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
  /** Enable user feedback collection */
  enableFeedback?: boolean;
}

/**
 * State for ErrorBoundary component
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  feedbackSubmitted: boolean;
}

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  feedbackSubmitted: boolean;
  showDetails: boolean;
  errorMessage?: string;
  enableFeedback: boolean;
  onReset: () => void;
  onSubmitFeedback: () => void;
}
