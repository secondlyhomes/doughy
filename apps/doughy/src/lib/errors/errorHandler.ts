// src/lib/errors/errorHandler.ts
// Central error handler service

import { Alert } from 'react-native';
import { AppError, isAppError, ErrorCode, ErrorCategory } from './types';
import { getErrorConfig, isNetworkErrorMessage, httpStatusToErrorCode } from './errorMessages';

/**
 * Toast display function type (injected by ErrorProvider)
 */
export type ToastFunction = (options: {
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}) => void;

/**
 * Error handler configuration
 */
interface ErrorHandlerConfig {
  /** Toast display function */
  toast?: ToastFunction;
  /** Enable console logging */
  enableLogging?: boolean;
  /** Custom error reporter (e.g., Sentry) */
  reportError?: (error: AppError) => void;
  /** Callback for auth errors (to trigger sign out) */
  onAuthError?: (error: AppError) => void;
}

/**
 * Global error handler instance
 */
class ErrorHandler {
  private config: ErrorHandlerConfig = {
    enableLogging: __DEV__,
  };

  /**
   * Configure the error handler
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set toast function (called from ErrorProvider)
   */
  setToast(toast: ToastFunction): void {
    this.config.toast = toast;
  }

  /**
   * Handle an error and display appropriate UI
   */
  handle(error: unknown): void {
    const appError = this.normalize(error);

    // Log error in development
    if (this.config.enableLogging) {
      console.error('[ErrorHandler]', appError.toJSON());
    }

    // Report to external service
    if (this.config.reportError) {
      this.config.reportError(appError);
    }

    // Handle auth errors specially
    if (appError.isAuthError() && this.config.onAuthError) {
      this.config.onAuthError(appError);
      return;
    }

    // Display based on category
    this.display(appError);
  }

  /**
   * Normalize any error to AppError
   */
  normalize(error: unknown): AppError {
    if (isAppError(error)) {
      return error;
    }

    // Handle fetch/network errors
    if (error instanceof TypeError) {
      const message = error.message;
      if (isNetworkErrorMessage(message)) {
        return AppError.transient('NETWORK_ERROR', getErrorConfig('NETWORK_ERROR').message, {
          cause: error,
          retryable: true,
        });
      }
    }

    // Handle response errors with status codes
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status: number }).status;
      const code = httpStatusToErrorCode(status);
      const config = getErrorConfig(code);
      return new AppError({
        code,
        userMessage: config.message,
        category: config.defaultCategory,
        severity: config.defaultSeverity,
        retryable: config.defaultRetryable,
        cause: error,
      });
    }

    // Generic error handling
    const message = error instanceof Error ? error.message : String(error);

    // Try to detect network errors from message
    if (isNetworkErrorMessage(message)) {
      return AppError.transient('NETWORK_ERROR', getErrorConfig('NETWORK_ERROR').message, {
        cause: error,
        retryable: true,
      });
    }

    return AppError.from(error);
  }

  /**
   * Display error based on category
   */
  private display(error: AppError): void {
    switch (error.category) {
      case 'transient':
        this.showToast(error);
        break;
      case 'actionRequired':
        this.showAlert(error);
        break;
      case 'inline':
        // Inline errors are handled by the component displaying them
        // Just log for debugging
        if (this.config.enableLogging) {
          console.log('[ErrorHandler] Inline error:', error.userMessage);
        }
        break;
    }
  }

  /**
   * Show toast notification for transient errors
   */
  private showToast(error: AppError): void {
    const toast = this.config.toast;

    if (toast) {
      toast({
        title: this.getToastTitle(error),
        description: error.userMessage,
        type: this.severityToToastType(error.severity),
        duration: 4000,
        action: error.retryable && error.onRetry
          ? { label: 'Retry', onPress: error.onRetry }
          : undefined,
      });
    } else {
      // Fallback to Alert if toast not configured
      this.showAlert(error);
    }
  }

  /**
   * Show alert dialog for action-required errors
   */
  private showAlert(error: AppError): void {
    const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }> = [
      { text: 'OK', style: 'default' },
    ];

    if (error.retryable && error.onRetry) {
      buttons.unshift({
        text: 'Retry',
        onPress: error.onRetry,
      });
    }

    Alert.alert(
      this.getAlertTitle(error),
      error.userMessage,
      buttons
    );
  }

  /**
   * Get toast title based on error severity
   */
  private getToastTitle(error: AppError): string {
    switch (error.severity) {
      case 'info':
        return 'Info';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'critical':
        return 'Critical Error';
      default:
        return 'Error';
    }
  }

  /**
   * Get alert title based on error severity
   */
  private getAlertTitle(error: AppError): string {
    switch (error.severity) {
      case 'info':
        return 'Information';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'critical':
        return 'Critical Error';
      default:
        return 'Error';
    }
  }

  /**
   * Map severity to toast type
   */
  private severityToToastType(
    severity: string
  ): 'default' | 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
      case 'critical':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Create an AppError from code with defaults
   */
  createError(
    code: ErrorCode,
    options?: Partial<{
      userMessage: string;
      category: ErrorCategory;
      retryable: boolean;
      onRetry: () => void | Promise<void>;
      cause: unknown;
    }>
  ): AppError {
    const config = getErrorConfig(code);
    return new AppError({
      code,
      userMessage: options?.userMessage || config.message,
      category: options?.category || config.defaultCategory,
      severity: config.defaultSeverity,
      retryable: options?.retryable ?? config.defaultRetryable,
      onRetry: options?.onRetry,
      cause: options?.cause,
    });
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Convenience function to show a simple error toast
 * (Non-breaking migration helper for Alert.alert replacement)
 */
export function showError(
  message: string,
  options?: {
    title?: string;
    retryable?: boolean;
    onRetry?: () => void;
  }
): void {
  errorHandler.handle(
    new AppError({
      code: 'UNKNOWN_ERROR',
      userMessage: message,
      category: 'transient',
      retryable: options?.retryable,
      onRetry: options?.onRetry,
    })
  );
}

/**
 * Convenience function to show a success toast
 */
export function showSuccess(message: string, title = 'Success'): void {
  const toast = (errorHandler as any).config?.toast;
  if (toast) {
    toast({
      title,
      description: message,
      type: 'success',
      duration: 3000,
    });
  }
}

/**
 * Convenience function to show a warning toast
 */
export function showWarning(message: string, title = 'Warning'): void {
  const toast = (errorHandler as any).config?.toast;
  if (toast) {
    toast({
      title,
      description: message,
      type: 'warning',
      duration: 4000,
    });
  }
}

/**
 * Convenience function to show an info toast
 */
export function showInfo(message: string, title = 'Info'): void {
  const toast = (errorHandler as any).config?.toast;
  if (toast) {
    toast({
      title,
      description: message,
      type: 'info',
      duration: 4000,
    });
  }
}
