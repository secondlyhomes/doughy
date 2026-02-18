/**
 * Analytics Hook
 *
 * React hook and HOC for accessing analytics context.
 */

import React, { useContext, createContext } from 'react';
import { AnalyticsContextValue } from '../types';

/**
 * Analytics context (created here, used by provider)
 */
export const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

/**
 * Hook to access analytics context
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { track, isReady } = useAnalytics();
 *
 *   const handleClick = () => {
 *     if (isReady) {
 *       track('button_clicked', { buttonId: 'submit' });
 *     }
 *   };
 * }
 * ```
 */
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  return context;
}

/**
 * @deprecated Use useAnalytics instead
 */
export const useAnalyticsContext = useAnalytics;

/**
 * Higher-order component to provide analytics context
 *
 * @example
 * ```tsx
 * const ScreenWithAnalytics = withAnalytics(MyScreen);
 * ```
 */
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P & { analytics?: AnalyticsContextValue }>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const analytics = useAnalytics();
    return React.createElement(Component, { ...props, analytics });
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
