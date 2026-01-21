// src/lib/errors/errorMessages.ts
// User-friendly error message mappings

import type { ErrorCode, ErrorCategory, ErrorSeverity } from './types';

/**
 * Error message configuration
 */
export interface ErrorMessageConfig {
  /** User-friendly message */
  message: string;
  /** Default category for this error type */
  defaultCategory: ErrorCategory;
  /** Default severity */
  defaultSeverity: ErrorSeverity;
  /** Whether this error is typically retryable */
  defaultRetryable: boolean;
}

/**
 * Error message mappings by error code
 */
export const errorMessages: Record<string, ErrorMessageConfig> = {
  // Network errors
  NETWORK_ERROR: {
    message: 'Unable to connect to the server. Please check your internet connection.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
  NETWORK_OFFLINE: {
    message: 'You appear to be offline. Please check your internet connection.',
    defaultCategory: 'transient',
    defaultSeverity: 'warning',
    defaultRetryable: true,
  },
  NETWORK_TIMEOUT: {
    message: 'The request timed out. Please try again.',
    defaultCategory: 'transient',
    defaultSeverity: 'warning',
    defaultRetryable: true,
  },

  // Authentication errors
  AUTH_EXPIRED: {
    message: 'Your session has expired. Please sign in again.',
    defaultCategory: 'actionRequired',
    defaultSeverity: 'warning',
    defaultRetryable: false,
  },
  AUTH_INVALID: {
    message: 'Invalid credentials. Please check your email and password.',
    defaultCategory: 'inline',
    defaultSeverity: 'error',
    defaultRetryable: false,
  },
  AUTH_REQUIRED: {
    message: 'Please sign in to continue.',
    defaultCategory: 'actionRequired',
    defaultSeverity: 'info',
    defaultRetryable: false,
  },

  // Permission errors
  PERMISSION_DENIED: {
    message: "You don't have permission to perform this action.",
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: false,
  },
  RESOURCE_NOT_FOUND: {
    message: 'The requested item could not be found.',
    defaultCategory: 'transient',
    defaultSeverity: 'warning',
    defaultRetryable: false,
  },

  // Validation errors
  VALIDATION_ERROR: {
    message: 'Please check your input and try again.',
    defaultCategory: 'inline',
    defaultSeverity: 'warning',
    defaultRetryable: false,
  },
  INVALID_INPUT: {
    message: 'The provided input is invalid.',
    defaultCategory: 'inline',
    defaultSeverity: 'warning',
    defaultRetryable: false,
  },

  // Server errors
  SERVER_ERROR: {
    message: 'Something went wrong on our end. Please try again later.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
  SERVICE_UNAVAILABLE: {
    message: 'The service is temporarily unavailable. Please try again later.',
    defaultCategory: 'transient',
    defaultSeverity: 'warning',
    defaultRetryable: true,
  },

  // Data operation errors
  SAVE_FAILED: {
    message: 'Failed to save your changes. Please try again.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
  LOAD_FAILED: {
    message: 'Failed to load data. Please try again.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
  DELETE_FAILED: {
    message: 'Failed to delete the item. Please try again.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
  SYNC_FAILED: {
    message: 'Failed to sync data. Your changes may not be saved.',
    defaultCategory: 'transient',
    defaultSeverity: 'warning',
    defaultRetryable: true,
  },

  // Generic
  UNKNOWN_ERROR: {
    message: 'An unexpected error occurred. Please try again.',
    defaultCategory: 'transient',
    defaultSeverity: 'error',
    defaultRetryable: true,
  },
};

/**
 * Get error message config for an error code
 */
export function getErrorConfig(code: ErrorCode): ErrorMessageConfig {
  return (
    errorMessages[code] || {
      message: 'An error occurred.',
      defaultCategory: 'transient' as ErrorCategory,
      defaultSeverity: 'error' as ErrorSeverity,
      defaultRetryable: false,
    }
  );
}

/**
 * Get user-friendly message for an error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return getErrorConfig(code).message;
}

/**
 * Map HTTP status codes to error codes
 */
export function httpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'INVALID_INPUT';
    case 401:
      return 'AUTH_REQUIRED';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'RESOURCE_NOT_FOUND';
    case 408:
      return 'NETWORK_TIMEOUT';
    case 422:
      return 'VALIDATION_ERROR';
    case 500:
      return 'SERVER_ERROR';
    case 502:
    case 503:
    case 504:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
  }
}

/**
 * Check if error message suggests a network issue
 */
export function isNetworkErrorMessage(message: string): boolean {
  const networkPatterns = [
    /network/i,
    /internet/i,
    /offline/i,
    /connection/i,
    /timeout/i,
    /fetch failed/i,
    /net::ERR_/i,
  ];
  return networkPatterns.some((pattern) => pattern.test(message));
}
