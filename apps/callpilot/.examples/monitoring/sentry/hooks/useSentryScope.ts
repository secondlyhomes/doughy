/**
 * Custom hook for managing Sentry scope
 *
 * Provides easy access to Sentry context management, breadcrumbs,
 * tags, and extra data within React components.
 *
 * @example
 * ```typescript
 * import { useSentryScope } from './hooks/useSentryScope';
 *
 * function MyComponent() {
 *   const { addBreadcrumb, setContext, setTag } = useSentryScope();
 *
 *   const handleClick = () => {
 *     addBreadcrumb('User clicked button');
 *     setTag('action', 'button-click');
 *   };
 *
 *   return <Button onPress={handleClick}>Click Me</Button>;
 * }
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react-native';

/**
 * Breadcrumb level types
 */
export type BreadcrumbLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

/**
 * Breadcrumb options
 */
export interface BreadcrumbOptions {
  /** Breadcrumb category (e.g., 'navigation', 'user.action', 'api') */
  category?: string;
  /** Severity level */
  level?: BreadcrumbLevel;
  /** Additional data to attach */
  data?: Record<string, any>;
}

/**
 * Context data for Sentry
 */
export interface ContextData {
  [key: string]: any;
}

/**
 * Return type for useSentryScope hook
 */
export interface SentryScopeHook {
  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb: (message: string, options?: BreadcrumbOptions) => void;

  /**
   * Set a context (structured data)
   */
  setContext: (name: string, data: ContextData | null) => void;

  /**
   * Set a tag (key-value pair for filtering)
   */
  setTag: (key: string, value: string) => void;

  /**
   * Set multiple tags at once
   */
  setTags: (tags: Record<string, string>) => void;

  /**
   * Set extra data (unstructured data)
   */
  setExtra: (key: string, value: any) => void;

  /**
   * Set multiple extra data at once
   */
  setExtras: (extras: Record<string, any>) => void;

  /**
   * Clear all scope data
   */
  clearScope: () => void;

  /**
   * Configure scope for specific operation
   */
  configureScope: (callback: (scope: Sentry.Scope) => void) => void;
}

/**
 * Hook for managing Sentry scope within a component
 *
 * Automatically cleans up scope data when component unmounts.
 */
export function useSentryScope(): SentryScopeHook {
  // Track tags and extras to clean up on unmount
  const tagsRef = useRef<Set<string>>(new Set());
  const extrasRef = useRef<Set<string>>(new Set());
  const contextsRef = useRef<Set<string>>(new Set());

  /**
   * Add a breadcrumb
   */
  const addBreadcrumb = useCallback(
    (message: string, options?: BreadcrumbOptions): void => {
      Sentry.addBreadcrumb({
        message,
        category: options?.category || 'manual',
        level: options?.level || 'info',
        data: options?.data,
        timestamp: Date.now() / 1000,
      });
    },
    []
  );

  /**
   * Set context data
   */
  const setContext = useCallback((name: string, data: ContextData | null): void => {
    Sentry.setContext(name, data);
    if (data !== null) {
      contextsRef.current.add(name);
    } else {
      contextsRef.current.delete(name);
    }
  }, []);

  /**
   * Set a single tag
   */
  const setTag = useCallback((key: string, value: string): void => {
    Sentry.setTag(key, value);
    tagsRef.current.add(key);
  }, []);

  /**
   * Set multiple tags
   */
  const setTags = useCallback((tags: Record<string, string>): void => {
    Sentry.setTags(tags);
    Object.keys(tags).forEach(key => {
      tagsRef.current.add(key);
    });
  }, []);

  /**
   * Set a single extra data
   */
  const setExtra = useCallback((key: string, value: any): void => {
    Sentry.setExtra(key, value);
    extrasRef.current.add(key);
  }, []);

  /**
   * Set multiple extra data
   */
  const setExtras = useCallback((extras: Record<string, any>): void => {
    Sentry.setExtras(extras);
    Object.keys(extras).forEach(key => {
      extrasRef.current.add(key);
    });
  }, []);

  /**
   * Clear all scope data
   */
  const clearScope = useCallback((): void => {
    Sentry.configureScope(scope => {
      // Clear tags
      tagsRef.current.forEach(key => {
        scope.setTag(key, '');
      });
      tagsRef.current.clear();

      // Clear extras
      extrasRef.current.forEach(key => {
        scope.setExtra(key, undefined);
      });
      extrasRef.current.clear();

      // Clear contexts
      contextsRef.current.forEach(name => {
        scope.setContext(name, null);
      });
      contextsRef.current.clear();
    });
  }, []);

  /**
   * Configure scope directly
   */
  const configureScope = useCallback((callback: (scope: Sentry.Scope) => void): void => {
    Sentry.configureScope(callback);
  }, []);

  // Clean up scope when component unmounts
  useEffect(() => {
    return () => {
      clearScope();
    };
  }, [clearScope]);

  return {
    addBreadcrumb,
    setContext,
    setTag,
    setTags,
    setExtra,
    setExtras,
    clearScope,
    configureScope,
  };
}

/**
 * Hook for tracking component lifecycle with breadcrumbs
 *
 * @example
 * ```typescript
 * function MyScreen() {
 *   useComponentLifecycleTracking('MyScreen');
 *   // Component mount/unmount will be tracked automatically
 * }
 * ```
 */
export function useComponentLifecycleTracking(componentName: string): void {
  const { addBreadcrumb } = useSentryScope();

  useEffect(() => {
    addBreadcrumb(`${componentName} mounted`, {
      category: 'component.lifecycle',
      level: 'debug',
      data: { component: componentName },
    });

    return () => {
      addBreadcrumb(`${componentName} unmounted`, {
        category: 'component.lifecycle',
        level: 'debug',
        data: { component: componentName },
      });
    };
  }, [componentName, addBreadcrumb]);
}

/**
 * Hook for tracking user actions with breadcrumbs
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const trackAction = useActionTracking();
 *
 *   const handleSubmit = () => {
 *     trackAction('form-submit', { formId: 'login' });
 *     // ... rest of submit logic
 *   };
 * }
 * ```
 */
export function useActionTracking(): (
  action: string,
  data?: Record<string, any>
) => void {
  const { addBreadcrumb } = useSentryScope();

  return useCallback(
    (action: string, data?: Record<string, any>): void => {
      addBreadcrumb(`User action: ${action}`, {
        category: 'user.action',
        level: 'info',
        data,
      });
    },
    [addBreadcrumb]
  );
}

/**
 * Hook for tracking API calls with breadcrumbs
 *
 * @example
 * ```typescript
 * function useUserData() {
 *   const { trackStart, trackSuccess, trackError } = useApiTracking();
 *
 *   const fetchUser = async (id: string) => {
 *     trackStart('fetchUser', { userId: id });
 *     try {
 *       const data = await api.getUser(id);
 *       trackSuccess('fetchUser');
 *       return data;
 *     } catch (error) {
 *       trackError('fetchUser', error);
 *       throw error;
 *     }
 *   };
 * }
 * ```
 */
export function useApiTracking(): {
  trackStart: (endpoint: string, data?: Record<string, any>) => void;
  trackSuccess: (endpoint: string, data?: Record<string, any>) => void;
  trackError: (endpoint: string, error: any, data?: Record<string, any>) => void;
} {
  const { addBreadcrumb } = useSentryScope();

  const trackStart = useCallback(
    (endpoint: string, data?: Record<string, any>): void => {
      addBreadcrumb(`API: ${endpoint} started`, {
        category: 'api.request',
        level: 'info',
        data: { endpoint, ...data },
      });
    },
    [addBreadcrumb]
  );

  const trackSuccess = useCallback(
    (endpoint: string, data?: Record<string, any>): void => {
      addBreadcrumb(`API: ${endpoint} succeeded`, {
        category: 'api.response',
        level: 'info',
        data: { endpoint, status: 'success', ...data },
      });
    },
    [addBreadcrumb]
  );

  const trackError = useCallback(
    (endpoint: string, error: any, data?: Record<string, any>): void => {
      addBreadcrumb(`API: ${endpoint} failed`, {
        category: 'api.error',
        level: 'error',
        data: {
          endpoint,
          status: 'error',
          error: error?.message || String(error),
          ...data,
        },
      });
    },
    [addBreadcrumb]
  );

  return { trackStart, trackSuccess, trackError };
}
