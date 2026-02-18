/**
 * PostHog Analytics Configuration
 *
 * PostHog is an open-source product analytics platform that provides
 * event tracking, feature flags, A/B testing, and session recordings.
 *
 * Free tier: 1M events/month
 *
 * Installation:
 * ```bash
 * npm install posthog-react-native expo-file-system expo-application expo-localization
 * ```
 *
 * Environment variables required:
 * - EXPO_PUBLIC_POSTHOG_KEY: Your PostHog project API key
 * - EXPO_PUBLIC_POSTHOG_HOST: Your PostHog instance URL (default: https://app.posthog.com)
 */

import PostHog from 'posthog-react-native';

/**
 * PostHog configuration options
 */
export interface PostHogConfig {
  /** PostHog API key */
  apiKey: string;
  /** PostHog instance host URL */
  host?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Capture application lifecycle events automatically */
  captureApplicationLifecycleEvents?: boolean;
  /** Capture deep links automatically */
  captureDeepLinks?: boolean;
  /** Maximum number of events to queue before flushing */
  maxQueueSize?: number;
  /** Maximum time (seconds) before flushing events */
  flushInterval?: number;
  /** Enable session recording */
  enableSessionRecording?: boolean;
}

/**
 * Default PostHog configuration
 */
const DEFAULT_CONFIG: Partial<PostHogConfig> = {
  host: 'https://app.posthog.com',
  debug: __DEV__,
  captureApplicationLifecycleEvents: true,
  captureDeepLinks: true,
  maxQueueSize: 100,
  flushInterval: 30, // 30 seconds
  enableSessionRecording: false, // Opt-in for privacy
};

/**
 * PostHog client instance
 */
let posthogClient: PostHog | null = null;

/**
 * Initialize PostHog analytics
 *
 * @example
 * ```typescript
 * import { initPostHog } from './posthogConfig';
 *
 * // In your App.tsx
 * const posthog = await initPostHog({
 *   apiKey: process.env.EXPO_PUBLIC_POSTHOG_KEY!,
 * });
 * ```
 */
export async function initPostHog(config: PostHogConfig): Promise<PostHog> {
  const apiKey = config.apiKey || process.env.EXPO_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    throw new Error('[PostHog] No API key provided');
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config, apiKey };

  // Create PostHog client
  posthogClient = new PostHog(finalConfig.apiKey, {
    host: finalConfig.host,
    captureApplicationLifecycleEvents: finalConfig.captureApplicationLifecycleEvents,
    captureDeepLinks: finalConfig.captureDeepLinks,
    maxQueueSize: finalConfig.maxQueueSize,
    flushInterval: finalConfig.flushInterval,
    enableSessionRecording: finalConfig.enableSessionRecording,
  });

  if (finalConfig.debug) {
    console.log('[PostHog] Initialized with config:', {
      host: finalConfig.host,
      apiKey: `${finalConfig.apiKey.substring(0, 8)}...`,
    });
  }

  return posthogClient;
}

/**
 * Get PostHog client instance
 */
export function getPostHog(): PostHog | null {
  return posthogClient;
}

/**
 * Identify a user
 *
 * @example
 * ```typescript
 * identifyUser('user-123', {
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   plan: 'premium',
 * });
 * ```
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, any>
): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.identify(userId, properties);

  if (__DEV__) {
    console.log('[PostHog] User identified:', userId, properties);
  }
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.reset();

  if (__DEV__) {
    console.log('[PostHog] User reset');
  }
}

/**
 * Track an event
 *
 * @example
 * ```typescript
 * trackEvent('button_clicked', {
 *   buttonId: 'submit',
 *   screen: 'login',
 * });
 * ```
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.capture(eventName, properties);

  if (__DEV__) {
    console.log('[PostHog] Event tracked:', eventName, properties);
  }
}

/**
 * Track a screen view
 *
 * @example
 * ```typescript
 * trackScreen('Dashboard', {
 *   userId: 'user-123',
 * });
 * ```
 */
export function trackScreen(
  screenName: string,
  properties?: Record<string, any>
): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.screen(screenName, properties);

  if (__DEV__) {
    console.log('[PostHog] Screen tracked:', screenName, properties);
  }
}

/**
 * Set user properties
 *
 * @example
 * ```typescript
 * setUserProperties({
 *   plan: 'premium',
 *   lastActive: new Date().toISOString(),
 * });
 * ```
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.identify(undefined, properties);

  if (__DEV__) {
    console.log('[PostHog] User properties set:', properties);
  }
}

/**
 * Set user properties once (won't override existing values)
 *
 * @example
 * ```typescript
 * setUserPropertiesOnce({
 *   signupDate: new Date().toISOString(),
 *   initialReferrer: 'google',
 * });
 * ```
 */
export function setUserPropertiesOnce(properties: Record<string, any>): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  // PostHog uses $set_once for this
  posthogClient.capture('$set_once', {
    $set_once: properties,
  });

  if (__DEV__) {
    console.log('[PostHog] User properties set once:', properties);
  }
}

/**
 * Get feature flag value
 *
 * @example
 * ```typescript
 * const isEnabled = await getFeatureFlag('new-dashboard');
 * if (isEnabled) {
 *   // Show new dashboard
 * }
 * ```
 */
export async function getFeatureFlag(
  flagKey: string
): Promise<boolean | string | undefined> {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return undefined;
  }

  const value = await posthogClient.getFeatureFlag(flagKey);

  if (__DEV__) {
    console.log('[PostHog] Feature flag:', flagKey, value);
  }

  return value;
}

/**
 * Check if feature flag is enabled
 *
 * @example
 * ```typescript
 * if (await isFeatureFlagEnabled('new-onboarding')) {
 *   showNewOnboarding();
 * }
 * ```
 */
export async function isFeatureFlagEnabled(flagKey: string): Promise<boolean> {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return false;
  }

  const value = await posthogClient.isFeatureEnabled(flagKey);

  if (__DEV__) {
    console.log('[PostHog] Feature flag enabled?', flagKey, value);
  }

  return value || false;
}

/**
 * Get all feature flags
 *
 * @example
 * ```typescript
 * const flags = await getAllFeatureFlags();
 * console.log('Active flags:', flags);
 * ```
 */
export async function getAllFeatureFlags(): Promise<Record<string, boolean | string>> {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return {};
  }

  const flags = await posthogClient.getFeatureFlags();

  if (__DEV__) {
    console.log('[PostHog] All feature flags:', flags);
  }

  return flags || {};
}

/**
 * Reload feature flags (use after user login/property change)
 *
 * @example
 * ```typescript
 * await reloadFeatureFlags();
 * ```
 */
export async function reloadFeatureFlags(): Promise<void> {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  await posthogClient.reloadFeatureFlags();

  if (__DEV__) {
    console.log('[PostHog] Feature flags reloaded');
  }
}

/**
 * Register properties to be sent with every event
 *
 * @example
 * ```typescript
 * registerSuperProperties({
 *   app_version: '1.0.0',
 *   platform: 'ios',
 * });
 * ```
 */
export function registerSuperProperties(properties: Record<string, any>): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.register(properties);

  if (__DEV__) {
    console.log('[PostHog] Super properties registered:', properties);
  }
}

/**
 * Flush events immediately (useful before app closes)
 *
 * @example
 * ```typescript
 * await flushEvents();
 * ```
 */
export async function flushEvents(): Promise<void> {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  await posthogClient.flush();

  if (__DEV__) {
    console.log('[PostHog] Events flushed');
  }
}

/**
 * Opt user out of tracking
 *
 * @example
 * ```typescript
 * optOut(); // User opted out
 * optIn();  // User opted back in
 * ```
 */
export function optOut(): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.optOut();

  if (__DEV__) {
    console.log('[PostHog] User opted out');
  }
}

/**
 * Opt user back in to tracking
 */
export function optIn(): void {
  if (!posthogClient) {
    console.warn('[PostHog] Client not initialized');
    return;
  }

  posthogClient.optIn();

  if (__DEV__) {
    console.log('[PostHog] User opted in');
  }
}
