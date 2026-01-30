// src/context/ErrorContext.tsx
// Error handling context for React components

import React, { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/Toast';
import { errorHandler, AppError, showError, showSuccess, showWarning, showInfo } from '@/lib/errors';

/**
 * Error context value
 */
interface ErrorContextValue {
  /** Handle an error (displays appropriate UI based on category) */
  handleError: (error: unknown) => void;
  /** Show a simple error toast */
  showError: (message: string, options?: { retryable?: boolean; onRetry?: () => void }) => void;
  /** Show a success toast */
  showSuccess: (message: string, title?: string) => void;
  /** Show a warning toast */
  showWarning: (message: string, title?: string) => void;
  /** Show an info toast */
  showInfo: (message: string, title?: string) => void;
  /** Create and throw an AppError */
  createError: typeof errorHandler.createError;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

/**
 * Error provider props
 */
interface ErrorProviderProps {
  children: ReactNode;
  /** Called when auth errors occur (e.g., to trigger sign out) */
  onAuthError?: (error: AppError) => void;
  /** Custom error reporter (e.g., Sentry) */
  reportError?: (error: AppError) => void;
}

/**
 * ErrorProvider component
 *
 * Wraps your app to provide centralized error handling.
 * Must be placed inside ToastProvider.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <ErrorProvider onAuthError={handleAuthError}>
 *     <App />
 *   </ErrorProvider>
 * </ToastProvider>
 * ```
 */
export function ErrorProvider({ children, onAuthError, reportError }: ErrorProviderProps) {
  const { toast } = useToast();

  // Configure error handler with toast function
  useEffect(() => {
    // Create an enhanced toast function that supports actions
    const enhancedToast: typeof toast = (options) => {
      // The current toast doesn't support actions, so we just show the toast
      // Actions will be added when we update the Toast component
      toast({
        title: options.title,
        description: options.description,
        type: options.type,
        duration: options.duration,
      });
    };

    errorHandler.configure({
      onAuthError,
      reportError,
    });

    // Set the toast function
    errorHandler.setToast((options) => {
      enhancedToast({
        title: options.title,
        description: options.description,
        type: options.type,
        duration: options.duration,
      });
    });
  }, [toast, onAuthError, reportError]);

  // Set up global unhandled promise rejection handler
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent default console error
      event.preventDefault();

      // Handle the error
      errorHandler.handle(event.reason);
    };

    // Note: React Native doesn't have the same global error handling as web
    // This is primarily for web compatibility, but we can use ErrorUtils in RN
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }

    // For React Native, we can use ErrorUtils if available
    if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
      const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
      (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        if (!isFatal) {
          errorHandler.handle(error);
        }
        // Always call original handler for fatal errors
        originalHandler?.(error, isFatal);
      });

      return () => {
        (global as any).ErrorUtils.setGlobalHandler(originalHandler);
      };
    }

    return undefined;
  }, []);

  const handleError = useCallback((error: unknown) => {
    errorHandler.handle(error);
  }, []);

  const createError = useCallback(
    (...args: Parameters<typeof errorHandler.createError>) => {
      return errorHandler.createError(...args);
    },
    []
  );

  const value: ErrorContextValue = {
    handleError,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    createError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

/**
 * Hook to access error handling utilities
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { handleError, showSuccess } = useErrorHandler();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Changes saved successfully');
 *     } catch (error) {
 *       handleError(error);
 *     }
 *   };
 *
 *   return <Button onPress={handleSave}>Save</Button>;
 * }
 * ```
 */
export function useErrorHandler(): ErrorContextValue {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
}

export default ErrorProvider;
