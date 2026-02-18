/**
 * Sentry Configuration for React Native + Expo
 *
 * This file configures Sentry for error tracking, performance monitoring,
 * and user feedback collection in a React Native Expo application.
 *
 * Free tier: 5,000 events/month
 *
 * Installation:
 * ```bash
 * npx expo install @sentry/react-native
 * ```
 *
 * Environment variables required:
 * - EXPO_PUBLIC_SENTRY_DSN: Your Sentry project DSN
 * - EXPO_PUBLIC_SENTRY_ORG: Your Sentry organization slug (for releases)
 * - EXPO_PUBLIC_SENTRY_PROJECT: Your Sentry project slug (for releases)
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Sentry configuration options
 */
export interface SentryConfig {
  /** Sentry DSN from your project settings */
  dsn: string;
  /** Environment name (development, staging, production) */
  environment?: string;
  /** Sample rate for performance traces (0.0 - 1.0) */
  tracesSampleRate?: number;
  /** Sample rate for session replays (0.0 - 1.0) */
  replaysSessionSampleRate?: number;
  /** Sample rate for error session replays (0.0 - 1.0) */
  replaysOnErrorSampleRate?: number;
  /** Enable Sentry in Expo development mode */
  enableInExpoDevelopment?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Maximum breadcrumbs to keep */
  maxBreadcrumbs?: number;
  /** Attach stack traces to all messages */
  attachStacktrace?: boolean;
}

/**
 * Default Sentry configuration
 */
const DEFAULT_CONFIG: Partial<SentryConfig> = {
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in prod
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  enableInExpoDevelopment: false, // Don't send events in Expo dev
  debug: __DEV__,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
};

/**
 * PII (Personally Identifiable Information) patterns to filter
 */
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{16}\b/g, // Credit card numbers
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card with dashes
];

/**
 * Sensitive keys to redact from event data
 */
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'api_key',
  'apiKey',
  'auth',
  'authorization',
  'credit_card',
  'creditCard',
  'ssn',
  'social_security',
];

/**
 * Filter PII from a string
 */
function filterPII(text: string): string {
  let filtered = text;
  PII_PATTERNS.forEach(pattern => {
    filtered = filtered.replace(pattern, '[REDACTED]');
  });
  return filtered;
}

/**
 * Recursively redact sensitive data from objects
 */
function redactSensitiveData(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return filterPII(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if key is sensitive
      const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value, depth + 1);
      }
    }

    return redacted;
  }

  return obj;
}

/**
 * Initialize Sentry with the provided configuration
 *
 * @example
 * ```typescript
 * import { initSentry } from './sentryConfig';
 *
 * // In your App.tsx
 * initSentry({
 *   dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
 * });
 * ```
 */
export function initSentry(config: SentryConfig): void {
  const dsn = config.dsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] No DSN provided, Sentry will not be initialized');
    return;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config, dsn };

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    tracesSampleRate: finalConfig.tracesSampleRate,
    enableInExpoDevelopment: finalConfig.enableInExpoDevelopment,
    debug: finalConfig.debug,
    maxBreadcrumbs: finalConfig.maxBreadcrumbs,
    attachStacktrace: finalConfig.attachStacktrace,

    // Integration configuration
    integrations: [
      new Sentry.ReactNativeTracing({
        // Track navigation changes
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),

        // Track component mount times
        enableAutoPerformanceTracing: true,

        // Track fetch/XHR requests
        traceFetch: true,
        traceXHR: true,

        // Trace propagation for distributed tracing
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/[^/]+\.supabase\.co/,
          /^https:\/\/api\.yourdomain\.com/,
        ],
      }),
    ],

    // Before sending event - filter PII and sensitive data
    beforeSend(event, hint) {
      // Don't send events in development if disabled
      if (__DEV__ && !finalConfig.enableInExpoDevelopment) {
        console.log('[Sentry] Event captured (not sent in dev):', event);
        return null;
      }

      // Filter PII from exception messages
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => ({
          ...exception,
          value: exception.value ? filterPII(exception.value) : exception.value,
        }));
      }

      // Filter PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          message: breadcrumb.message ? filterPII(breadcrumb.message) : breadcrumb.message,
          data: breadcrumb.data ? redactSensitiveData(breadcrumb.data) : breadcrumb.data,
        }));
      }

      // Filter PII from extra data
      if (event.extra) {
        event.extra = redactSensitiveData(event.extra);
      }

      // Filter PII from request data
      if (event.request) {
        if (event.request.url) {
          event.request.url = filterPII(event.request.url);
        }
        if (event.request.data) {
          event.request.data = redactSensitiveData(event.request.data);
        }
        if (event.request.headers) {
          event.request.headers = redactSensitiveData(event.request.headers);
        }
      }

      return event;
    },

    // Before sending breadcrumb - filter sensitive data
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        if (breadcrumb.data?.to) {
          breadcrumb.data.to = filterPII(breadcrumb.data.to);
        }
        if (breadcrumb.data?.from) {
          breadcrumb.data.from = filterPII(breadcrumb.data.from);
        }
      }

      // Filter console breadcrumbs
      if (breadcrumb.category === 'console') {
        if (breadcrumb.message) {
          breadcrumb.message = filterPII(breadcrumb.message);
        }
      }

      // Filter fetch breadcrumbs
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = filterPII(breadcrumb.data.url);
        }
        // Remove request/response bodies as they might contain sensitive data
        delete breadcrumb.data?.request_body_size;
        delete breadcrumb.data?.response_body_size;
      }

      return breadcrumb;
    },
  });

  // Set app context
  Sentry.setContext('app', {
    name: Constants.expoConfig?.name || 'Unknown',
    version: Constants.expoConfig?.version || 'Unknown',
    expoVersion: Constants.expoVersion,
    platform: Platform.OS,
    platformVersion: Platform.Version,
  });

  // Set device context
  Sentry.setContext('device', {
    brand: Constants.deviceName,
    model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
  });

  // Set tags for better filtering
  Sentry.setTag('platform', Platform.OS);
  Sentry.setTag('expo.version', Constants.expoVersion || 'unknown');
  Sentry.setTag('app.version', Constants.expoConfig?.version || 'unknown');

  console.log(`[Sentry] Initialized in ${finalConfig.environment} mode`);
}

/**
 * Set user information for error tracking
 *
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   username: user.username,
 * });
 * ```
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    ...user,
  });
}

/**
 * Clear user context (call on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging context
 *
 * @example
 * ```typescript
 * addBreadcrumb({
 *   category: 'user.action',
 *   message: 'User clicked submit button',
 *   level: 'info',
 *   data: { formId: 'login-form' },
 * });
 * ```
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'manual',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Capture an exception manually
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, {
 *     tags: { operation: 'risky' },
 *     extra: { userId: user.id },
 *   });
 * }
 * ```
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture a message manually
 *
 * @example
 * ```typescript
 * captureMessage('Payment processed successfully', {
 *   level: 'info',
 *   tags: { operation: 'payment' },
 * });
 * ```
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
): string {
  return Sentry.captureMessage(message, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'info',
  });
}

/**
 * Wrap a function with error tracking
 *
 * @example
 * ```typescript
 * const safeOperation = wrapWithErrorTracking(
 *   async () => {
 *     await riskyOperation();
 *   },
 *   'risky-operation'
 * );
 * ```
 */
export function wrapWithErrorTracking<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          captureException(error, {
            tags: { operation: operationName },
            extra: { args },
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, {
        tags: { operation: operationName },
        extra: { args },
      });
      throw error;
    }
  }) as T;
}

/**
 * Start a new transaction for performance monitoring
 *
 * @example
 * ```typescript
 * const transaction = startTransaction('load-dashboard');
 * try {
 *   await loadDashboardData();
 *   transaction.finish();
 * } catch (error) {
 *   transaction.finish();
 *   throw error;
 * }
 * ```
 */
export function startTransaction(
  name: string,
  op?: string,
  description?: string
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op: op || 'custom',
    description,
  });
}

/**
 * Measure a specific operation
 *
 * @example
 * ```typescript
 * await measureOperation('fetch-user-data', async () => {
 *   return await fetchUserData();
 * });
 * ```
 */
export async function measureOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(operationName);

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
