/**
 * Error Boundary Component
 *
 * Catches React errors and provides fallback UI with recovery options.
 * Integrates with error reporting services (Sentry).
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallbackScreen />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorReport,
} from '../types/error-types';
import { ErrorStorage } from '../utils/error-storage';
import { ErrorFallback } from './ErrorFallback';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { errorCount, lastErrorTime } = this.state;

    const now = Date.now();
    const timeSinceLastError = lastErrorTime ? now - lastErrorTime : Infinity;
    const newErrorCount = timeSinceLastError > 60000 ? 1 : errorCount + 1;

    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now,
    });

    if (__DEV__) {
      console.error('ErrorBoundary caught:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        errorCount: newErrorCount,
        timeSinceLastError,
      });
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    // Store error report
    const report: ErrorReport = {
      timestamp: now,
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      platform: Platform.OS,
      appVersion: '1.0.0',
      userAgent: Platform.select({
        ios: `iOS ${Platform.Version}`,
        android: `Android ${Platform.Version}`,
        default: 'Unknown',
      }),
    };
    ErrorStorage.saveErrorReport(report);

    onError?.(error, errorInfo);

    if (newErrorCount >= 3) {
      this.scheduleReset();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (!hasError) return;

    if (resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) this.resetErrorBoundary();
    }

    if (resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
  }

  private scheduleReset = (delay: number = 5000): void => {
    if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
    this.resetTimeoutId = setTimeout(() => this.resetErrorBoundary(), delay);
  };

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    });
  };

  private reloadApp = (): void => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      this.resetErrorBoundary();
    }
  };

  private reportError = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    try {
      const report: ErrorReport = {
        timestamp: Date.now(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack ?? undefined,
        platform: Platform.OS,
        appVersion: '1.0.0',
        userAgent: Platform.select({
          ios: `iOS ${Platform.Version}`,
          android: `Android ${Platform.Version}`,
          default: 'Unknown',
        }),
      };
      await ErrorStorage.submitErrorReport(report);
      alert('Error report sent. Thank you!');
    } catch {
      alert('Failed to send error report. It will be sent later.');
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) return fallback;

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorCount={errorCount}
          onReset={this.resetErrorBoundary}
          onReload={this.reloadApp}
          onReport={this.reportError}
        />
      );
    }

    return children;
  }
}
