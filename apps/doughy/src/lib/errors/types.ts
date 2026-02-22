// src/lib/errors/types.ts
// Standardized error types for consistent error handling

/**
 * Error category - determines how the error is displayed
 */
export type ErrorCategory =
  | 'transient' // Toast, auto-dismiss (network errors, save success)
  | 'actionRequired' // AlertDialog, requires user action (confirmations, critical errors)
  | 'inline'; // Alert component, stays visible (form validation)

/**
 * Error severity - affects styling and prioritization
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Common error codes for type-safe error handling
 */
export type ErrorCode =
  // Network errors
  | 'NETWORK_ERROR'
  | 'NETWORK_OFFLINE'
  | 'NETWORK_TIMEOUT'
  // Authentication errors
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID'
  | 'AUTH_REQUIRED'
  // Permission errors
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  // Validation errors
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  // Server errors
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  // Data errors
  | 'SAVE_FAILED'
  | 'LOAD_FAILED'
  | 'DELETE_FAILED'
  | 'SYNC_FAILED'
  // Generic
  | 'UNKNOWN_ERROR'
  | string; // Allow custom codes

/**
 * Options for creating an AppError
 */
export interface AppErrorOptions {
  /** Error code for identification */
  code: ErrorCode;
  /** User-friendly message to display */
  userMessage: string;
  /** Category determines display method */
  category: ErrorCategory;
  /** Whether the operation can be retried */
  retryable?: boolean;
  /** Retry callback function */
  onRetry?: () => void | Promise<void>;
  /** Severity affects styling */
  severity?: ErrorSeverity;
  /** Original error for debugging */
  cause?: Error | unknown;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Standardized application error class
 *
 * @example
 * ```ts
 * throw new AppError({
 *   code: 'NETWORK_ERROR',
 *   userMessage: 'Unable to connect to server. Please check your internet connection.',
 *   category: 'transient',
 *   retryable: true,
 *   onRetry: () => fetchData(),
 * });
 * ```
 */
export class AppError extends Error {
  /** Error code for identification */
  readonly code: ErrorCode;
  /** User-friendly message to display */
  readonly userMessage: string;
  /** Category determines display method */
  readonly category: ErrorCategory;
  /** Whether the operation can be retried */
  readonly retryable: boolean;
  /** Retry callback function */
  readonly onRetry?: () => void | Promise<void>;
  /** Severity affects styling */
  readonly severity: ErrorSeverity;
  /** Original error for debugging */
  readonly cause?: Error | unknown;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.userMessage);
    this.name = 'AppError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.category = options.category;
    this.retryable = options.retryable ?? false;
    this.onRetry = options.onRetry;
    this.severity = options.severity ?? 'error';
    this.cause = options.cause;
    this.metadata = options.metadata;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create a transient error (shown as toast, auto-dismisses)
   */
  static transient(
    code: ErrorCode,
    userMessage: string,
    options?: Partial<Omit<AppErrorOptions, 'code' | 'userMessage' | 'category'>>
  ): AppError {
    return new AppError({
      code,
      userMessage,
      category: 'transient',
      severity: 'error',
      ...options,
    });
  }

  /**
   * Create an action-required error (shown as alert dialog)
   */
  static actionRequired(
    code: ErrorCode,
    userMessage: string,
    options?: Partial<Omit<AppErrorOptions, 'code' | 'userMessage' | 'category'>>
  ): AppError {
    return new AppError({
      code,
      userMessage,
      category: 'actionRequired',
      severity: 'error',
      ...options,
    });
  }

  /**
   * Create an inline error (shown in form/inline UI)
   */
  static inline(
    code: ErrorCode,
    userMessage: string,
    options?: Partial<Omit<AppErrorOptions, 'code' | 'userMessage' | 'category'>>
  ): AppError {
    return new AppError({
      code,
      userMessage,
      category: 'inline',
      severity: 'error',
      ...options,
    });
  }

  /**
   * Create from an unknown error (for catch blocks)
   */
  static from(
    error: unknown,
    fallbackMessage = 'An unexpected error occurred',
    category: ErrorCategory = 'transient'
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : String(error);

    return new AppError({
      code: 'UNKNOWN_ERROR',
      userMessage: fallbackMessage,
      category,
      cause: error,
      metadata: { originalMessage: message },
    });
  }

  /**
   * Check if error is retryable network error
   */
  isNetworkError(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'NETWORK_OFFLINE' ||
      this.code === 'NETWORK_TIMEOUT'
    );
  }

  /**
   * Check if error requires authentication
   */
  isAuthError(): boolean {
    return (
      this.code === 'AUTH_EXPIRED' ||
      this.code === 'AUTH_INVALID' ||
      this.code === 'AUTH_REQUIRED'
    );
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to extract user message from any error
 */
export function getUserMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
