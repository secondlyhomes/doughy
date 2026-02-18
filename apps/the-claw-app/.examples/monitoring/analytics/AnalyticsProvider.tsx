/**
 * Analytics Provider
 *
 * Thin provider component that initializes PostHog and provides analytics context.
 */

import React, { useEffect, useState, useCallback } from 'react';
import PostHog from 'posthog-react-native';
import { initPostHog } from './posthogConfig';
import { AnalyticsProviderProps, AnalyticsContextValue } from './types';
import { AnalyticsContext } from './hooks/useAnalytics';
import { createLogger, logWarn } from './utils';

/**
 * Analytics Provider Component
 *
 * Wraps your app to provide analytics context.
 *
 * @example
 * ```tsx
 * import { AnalyticsProvider } from './AnalyticsProvider';
 *
 * function App() {
 *   return (
 *     <AnalyticsProvider>
 *       <YourApp />
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */
export function AnalyticsProvider({
  children,
  apiKey,
  host,
  debug = __DEV__,
  disabled = false,
}: AnalyticsProviderProps): JSX.Element {
  const [posthog, setPosthog] = useState<PostHog | null>(null);
  const [isReady, setIsReady] = useState(false);
  const logger = createLogger(debug);

  // Initialize PostHog
  useEffect(() => {
    if (disabled) {
      logger.debug('Disabled');
      return;
    }

    const initialize = async () => {
      try {
        const key = apiKey || process.env.EXPO_PUBLIC_POSTHOG_KEY;
        if (!key) {
          logWarn('No API key provided');
          return;
        }

        const client = await initPostHog({ apiKey: key, host, debug });
        setPosthog(client);
        setIsReady(true);
        logger.debug('Initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize:', error);
      }
    };

    initialize();
  }, [apiKey, host, debug, disabled]);

  // Analytics methods
  const identify = useCallback(
    (userId: string, properties?: Record<string, any>) => {
      if (!posthog) return logWarn('Not initialized');
      posthog.identify(userId, properties);
      logger.debug('User identified:', userId, properties);
    },
    [posthog, logger]
  );

  const track = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      if (!posthog) return logWarn('Not initialized');
      posthog.capture(eventName, properties);
      logger.debug('Event tracked:', eventName, properties);
    },
    [posthog, logger]
  );

  const trackScreen = useCallback(
    (screenName: string, properties?: Record<string, any>) => {
      if (!posthog) return logWarn('Not initialized');
      posthog.screen(screenName, properties);
      logger.debug('Screen tracked:', screenName, properties);
    },
    [posthog, logger]
  );

  const setUserProperties = useCallback(
    (properties: Record<string, any>) => {
      if (!posthog) return logWarn('Not initialized');
      posthog.identify(undefined, properties);
      logger.debug('User properties set:', properties);
    },
    [posthog, logger]
  );

  const reset = useCallback(() => {
    if (!posthog) return logWarn('Not initialized');
    posthog.reset();
    logger.debug('User reset');
  }, [posthog, logger]);

  const getFeatureFlag = useCallback(
    async (flagKey: string): Promise<boolean | string | undefined> => {
      if (!posthog) {
        logWarn('Not initialized');
        return undefined;
      }
      const value = await posthog.getFeatureFlag(flagKey);
      logger.debug('Feature flag:', flagKey, value);
      return value;
    },
    [posthog, logger]
  );

  const isFeatureFlagEnabled = useCallback(
    async (flagKey: string): Promise<boolean> => {
      if (!posthog) {
        logWarn('Not initialized');
        return false;
      }
      const value = await posthog.isFeatureEnabled(flagKey);
      logger.debug('Feature flag enabled?', flagKey, value);
      return value || false;
    },
    [posthog, logger]
  );

  const reloadFeatureFlags = useCallback(async (): Promise<void> => {
    if (!posthog) return logWarn('Not initialized');
    await posthog.reloadFeatureFlags();
    logger.debug('Feature flags reloaded');
  }, [posthog, logger]);

  const optOut = useCallback(() => {
    if (!posthog) return logWarn('Not initialized');
    posthog.optOut();
    logger.debug('User opted out');
  }, [posthog, logger]);

  const optIn = useCallback(() => {
    if (!posthog) return logWarn('Not initialized');
    posthog.optIn();
    logger.debug('User opted in');
  }, [posthog, logger]);

  const value: AnalyticsContextValue = {
    posthog,
    isReady,
    identify,
    track,
    trackScreen,
    setUserProperties,
    reset,
    getFeatureFlag,
    isFeatureFlagEnabled,
    reloadFeatureFlags,
    optOut,
    optIn,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
