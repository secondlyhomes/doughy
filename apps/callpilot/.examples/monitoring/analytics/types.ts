/**
 * Analytics Types
 *
 * Type definitions for the analytics context and provider.
 */

import { ReactNode } from 'react';
import PostHog from 'posthog-react-native';

/**
 * Analytics context value type
 */
export interface AnalyticsContextValue {
  /** PostHog client instance */
  posthog: PostHog | null;
  /** Whether analytics is initialized */
  isReady: boolean;
  /** Identify a user */
  identify: (userId: string, properties?: Record<string, any>) => void;
  /** Track an event */
  track: (eventName: string, properties?: Record<string, any>) => void;
  /** Track a screen view */
  trackScreen: (screenName: string, properties?: Record<string, any>) => void;
  /** Set user properties */
  setUserProperties: (properties: Record<string, any>) => void;
  /** Reset user (logout) */
  reset: () => void;
  /** Get feature flag value */
  getFeatureFlag: (flagKey: string) => Promise<boolean | string | undefined>;
  /** Check if feature flag is enabled */
  isFeatureFlagEnabled: (flagKey: string) => Promise<boolean>;
  /** Reload feature flags */
  reloadFeatureFlags: () => Promise<void>;
  /** Opt out of tracking */
  optOut: () => void;
  /** Opt in to tracking */
  optIn: () => void;
}

/**
 * Props for AnalyticsProvider
 */
export interface AnalyticsProviderProps {
  /** Child components */
  children: ReactNode;
  /** PostHog API key (defaults to env var) */
  apiKey?: string;
  /** PostHog host URL (defaults to https://app.posthog.com) */
  host?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-track screen views */
  autoTrackScreenViews?: boolean;
  /** Disable analytics (useful for testing) */
  disabled?: boolean;
}

/**
 * Analytics initialization config
 */
export interface AnalyticsConfig {
  apiKey: string;
  host?: string;
  debug?: boolean;
}
