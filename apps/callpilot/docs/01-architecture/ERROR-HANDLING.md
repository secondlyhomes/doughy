# Error Handling Architecture

> Comprehensive error handling strategy: error boundaries, service-level errors, user-facing messages, and recovery patterns.

## Overview

A robust error handling strategy ensures:
- App doesn't crash on unexpected errors
- Users receive helpful, actionable error messages
- Errors are logged for debugging
- Recovery paths are available when possible

## Error Boundary Pattern

### Root Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import * as Sentry from '@sentry/react-native' // If using Sentry

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo)

    // Report to Sentry (if configured)
    if (Sentry.captureException) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}
```

### Error Fallback UI

```tsx
// src/components/ErrorFallback.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

interface ErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({
  error,
  onRetry,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
}: ErrorFallbackProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.icon]} accessibilityLabel="Error icon">
        ⚠️
      </Text>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>

      {__DEV__ && error && (
        <View style={[styles.debugContainer, { backgroundColor: theme.colors.neutral[100] }]}>
          <Text style={[styles.debugText, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        </View>
      )}

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.button, { backgroundColor: theme.colors.primary[500] }]}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={[styles.buttonText, { color: theme.colors.white }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: '100%',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
```

## Service-Level Error Handling

### Error Types

```tsx
// src/types/errors.ts
export interface AppErrorOptions {
  message: string;
  code: string;
  userMessage: string;
  recoverable?: boolean;
  cause?: Error;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly recoverable: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.recoverable = options.recoverable ?? true;
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super({
      message,
      code: 'NETWORK_ERROR',
      userMessage: 'Unable to connect. Please check your internet connection.',
      recoverable: true,
    });
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super({
      message,
      code,
      userMessage: 'Your session has expired. Please sign in again.',
      recoverable: true,
    });
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      userMessage: message, // Validation messages are user-facing
      recoverable: true,
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super({
      message: `${resource} not found`,
      code: 'NOT_FOUND',
      userMessage: `The requested ${resource.toLowerCase()} could not be found.`,
      recoverable: false,
    });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      recoverable: true,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
```

### Service Error Handling

```tsx
// src/services/taskService.ts
import { supabase } from './supabase'
import { AppError, NetworkError, NotFoundError } from '@/types/errors'
import type { Task } from '@/types'

export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new AppError({
          message: error.message,
          code: error.code || 'DB_ERROR',
          userMessage: 'Failed to load tasks. Please try again.',
          recoverable: true,
        });
      }

      return data as Task[]
    } catch (error) {
      if (error instanceof AppError) throw error

      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed')
      }

      // Unknown errors
      throw new AppError({
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN',
        userMessage: 'An unexpected error occurred.',
        recoverable: false,
      });
    }
  },

  async getTask(taskId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Task')
      }
      throw new AppError({
        message: error.message,
        code: error.code || 'DB_ERROR',
        userMessage: 'Failed to load task.',
        recoverable: true,
      });
    }

    return data as Task
  },
}
```

## Hook-Level Error Handling

```tsx
// src/hooks/useTasks.ts
import { useState, useCallback } from 'react'
import { taskService } from '@/services/taskService'
import { AppError } from '@/types/errors'
import type { Task } from '@/types'

interface UseTasksResult {
  tasks: Task[]
  isLoading: boolean
  error: AppError | null
  refetch: () => Promise<void>
  clearError: () => void
}

export function useTasks(userId: string): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await taskService.getTasks(userId)
      setTasks(data)
    } catch (err) {
      const appError = err instanceof AppError
        ? err
        : new AppError({
            message: err instanceof Error ? err.message : 'Unknown error',
            code: 'UNKNOWN',
            userMessage: 'Failed to load tasks.',
            recoverable: true,
          });
      setError(appError);
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    clearError,
  }
}
```

## User-Facing Error Messages

### Toast/Snackbar Pattern

```tsx
// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Animated, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/contexts/ThemeContext'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  action?: {
    label: string
    onPress: () => void
  }
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', action?: Toast['action']) => {
      const id = Date.now().toString()
      setToasts(prev => [...prev, { id, message, type, action }])

      // Auto-dismiss after 4 seconds (unless has action)
      if (!action) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
      }
    },
    []
  )

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case 'success': return theme.colors.success
      case 'error': return theme.colors.error
      case 'warning': return theme.colors.warning
      default: return theme.colors.info
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      {toasts.map(toast => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toast,
            {
              backgroundColor: getToastColor(toast.type),
              bottom: insets.bottom + 16,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.toastText}>{toast.message}</Text>
          {toast.action && (
            <Text
              style={styles.toastAction}
              onPress={() => {
                toast.action?.onPress()
                dismissToast(toast.id)
              }}
            >
              {toast.action.label}
            </Text>
          )}
        </Animated.View>
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  toastAction: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
  },
})
```

## Error Logging

### Sentry Integration

```tsx
// src/services/errorReporting.ts
import * as Sentry from '@sentry/react-native'
import { AppError } from '@/types/errors'

export function initErrorReporting() {
  if (__DEV__) return // Skip in development

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    enableInExpoDevelopment: false,
    debug: false,
  })
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('Error reported:', error, context)
    return
  }

  Sentry.withScope(scope => {
    if (context) {
      scope.setExtras(context)
    }

    if (error instanceof AppError) {
      scope.setTag('error_code', error.code)
      scope.setTag('recoverable', String(error.recoverable))
    }

    Sentry.captureException(error)
  })
}

export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email })
}

export function clearUserContext() {
  Sentry.setUser(null)
}
```

## Recovery Patterns

### Retry with Exponential Backoff

```tsx
// src/utils/retry.ts
interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  shouldRetry?: (error: Error) => boolean
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Usage
const data = await retryWithBackoff(
  () => taskService.getTasks(userId),
  {
    maxAttempts: 3,
    shouldRetry: (error) => error instanceof NetworkError,
  }
)
```

### Offline Queue

```tsx
// src/services/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

interface QueuedAction {
  id: string
  type: string
  payload: unknown
  timestamp: number
}

const QUEUE_KEY = '@offline_queue'

export const offlineQueue = {
  async add(type: string, payload: unknown) {
    const queue = await this.getQueue()
    const action: QueuedAction = {
      id: Date.now().toString(),
      type,
      payload,
      timestamp: Date.now(),
    }
    queue.push(action)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  },

  async getQueue(): Promise<QueuedAction[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY)
    return data ? JSON.parse(data) : []
  },

  async processQueue(handlers: Record<string, (payload: unknown) => Promise<void>>) {
    const state = await NetInfo.fetch()
    if (!state.isConnected) return

    const queue = await this.getQueue()
    const failedActions: QueuedAction[] = []

    for (const action of queue) {
      try {
        const handler = handlers[action.type]
        if (handler) {
          await handler(action.payload)
        }
      } catch (error) {
        failedActions.push(action)
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedActions))
  },
}
```

## Platform-Specific Error Handling

### iOS Considerations
- Handle keyboard-related dismissal errors gracefully
- Consider biometric authentication failure states
- Handle app state changes (background/foreground)

### Android Considerations
- Handle back button in error states
- Consider memory pressure scenarios
- Handle permission denial states

## Checklist

- [ ] Error boundary wraps app root
- [ ] Custom error types defined with user-friendly messages
- [ ] Service layer catches and transforms errors
- [ ] Hooks expose error state and clear/retry methods
- [ ] Toast/snackbar shows user-facing messages
- [ ] Error reporting service configured (Sentry)
- [ ] Retry logic for transient failures
- [ ] Offline queue for critical actions
- [ ] Error messages are accessible (role="alert")
- [ ] Dev mode shows debug info, prod mode hides it
