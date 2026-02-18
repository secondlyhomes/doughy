/**
 * Error Handling Types
 */

import { ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number | null;
}

export interface ErrorReport {
  timestamp: number;
  error: string;
  stack: string | undefined;
  componentStack: string | undefined;
  platform: string;
  appVersion: string;
  userAgent: string;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  onReset: () => void;
  onReload: () => void;
  onReport: () => void;
}

export interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}
