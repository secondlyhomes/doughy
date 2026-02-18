/**
 * Error Boundary with Sentry Integration
 *
 * A React error boundary that catches errors in component tree,
 * reports them to Sentry, and displays a fallback UI with retry option.
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from './ErrorBoundary';
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <YourApp />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react-native';

import { ErrorBoundaryProps, ErrorBoundaryState } from './types';
import { ErrorFallback } from './ErrorFallback';

/**
 * Error Boundary Component
 *
 * Catches React component errors, reports to Sentry, and shows fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      feedbackSubmitted: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;

    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      level: 'error',
    });

    this.setState({
      errorInfo,
      eventId,
    });

    if (onError) {
      onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      feedbackSubmitted: false,
    });
  };

  private handleSubmitFeedback = (): void => {
    const { eventId } = this.state;

    if (eventId) {
      Sentry.captureUserFeedback({
        event_id: eventId,
        name: 'User',
        email: 'user@example.com',
        comments: 'Error occurred in the app',
      });

      this.setState({ feedbackSubmitted: true });
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, eventId, feedbackSubmitted } = this.state;
    const {
      children,
      fallback,
      showDetails = __DEV__,
      errorMessage,
      enableFeedback = true,
    } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          eventId={eventId}
          feedbackSubmitted={feedbackSubmitted}
          showDetails={showDetails}
          errorMessage={errorMessage}
          enableFeedback={enableFeedback}
          onReset={this.handleReset}
          onSubmitFeedback={this.handleSubmitFeedback}
        />
      );
    }

    return children;
  }
}
