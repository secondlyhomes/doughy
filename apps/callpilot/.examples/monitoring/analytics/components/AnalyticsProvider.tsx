/**
 * Analytics Provider with Auto-Tracking
 *
 * Enhanced analytics provider that automatically tracks:
 * - Screen views (via navigation)
 * - Session duration
 * - App lifecycle events
 *
 * @example
 * ```tsx
 * import { AnalyticsProvider } from './components/AnalyticsProvider';
 *
 * function App() {
 *   return (
 *     <AnalyticsProvider>
 *       <NavigationContainer>
 *         <YourApp />
 *       </NavigationContainer>
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AnalyticsProvider as BaseAnalyticsProvider } from '../AnalyticsContext';
import { Events } from '../events';

/**
 * Props for AnalyticsProvider
 */
export interface AnalyticsProviderProps {
  /** Child components */
  children: ReactNode;
  /** PostHog API key */
  apiKey?: string;
  /** PostHog host URL */
  host?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-track screen views */
  autoTrackScreenViews?: boolean;
  /** Auto-track app lifecycle events */
  autoTrackLifecycle?: boolean;
  /** Disable analytics */
  disabled?: boolean;
}

/**
 * Enhanced Analytics Provider with Auto-Tracking
 */
export function AnalyticsProvider({
  children,
  apiKey,
  host,
  debug = __DEV__,
  autoTrackScreenViews = true,
  autoTrackLifecycle = true,
  disabled = false,
}: AnalyticsProviderProps): JSX.Element {
  const sessionStartRef = useRef<number>(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Track app lifecycle events
  useEffect(() => {
    if (!autoTrackLifecycle || disabled) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App went to background
      if (
        previousState === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        const sessionDuration = Date.now() - sessionStartRef.current;

        // Track backgrounding with session duration
        import('../posthogConfig').then(({ trackEvent }) => {
          trackEvent(Events.APP_BACKGROUNDED, {
            session_duration_ms: sessionDuration,
          });
        });
      }

      // App came to foreground
      if (
        (previousState === 'background' || previousState === 'inactive') &&
        nextAppState === 'active'
      ) {
        // Start new session
        sessionStartRef.current = Date.now();

        // Track foregrounding
        import('../posthogConfig').then(({ trackEvent }) => {
          trackEvent(Events.APP_FOREGROUNDED, {
            previous_state: previousState,
          });
        });
      }
    });

    // Track app launch
    import('../posthogConfig').then(({ trackEvent }) => {
      trackEvent(Events.APP_LAUNCHED, {
        cold_start: true,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [autoTrackLifecycle, disabled]);

  return (
    <BaseAnalyticsProvider
      apiKey={apiKey}
      host={host}
      debug={debug}
      autoTrackScreenViews={autoTrackScreenViews}
      disabled={disabled}
    >
      {children}
    </BaseAnalyticsProvider>
  );
}
