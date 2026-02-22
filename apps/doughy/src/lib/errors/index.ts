// src/lib/errors/index.ts
// Standardized error handling system

// Error types and classes
export {
  AppError,
  isAppError,
  getUserMessage,
} from './types';

export type {
  ErrorCategory,
  ErrorSeverity,
  ErrorCode,
  AppErrorOptions,
} from './types';

// Error messages and configuration
export {
  errorMessages,
  getErrorConfig,
  getErrorMessage,
  httpStatusToErrorCode,
  isNetworkErrorMessage,
} from './errorMessages';

export type { ErrorMessageConfig } from './errorMessages';

// Error handler service and utilities
export {
  errorHandler,
  showError,
  showSuccess,
  showWarning,
  showInfo,
} from './errorHandler';

export type { ToastFunction } from './errorHandler';
