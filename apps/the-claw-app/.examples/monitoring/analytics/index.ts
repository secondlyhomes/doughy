/**
 * Analytics Module
 *
 * Barrel export for analytics functionality.
 */

// Types
export type {
  AnalyticsContextValue,
  AnalyticsProviderProps,
  AnalyticsConfig,
} from './types';

// Provider
export { AnalyticsProvider } from './AnalyticsProvider';

// Hooks
export {
  useAnalytics,
  useAnalyticsContext,
  withAnalytics,
  AnalyticsContext,
} from './hooks/useAnalytics';

// Utils (internal, but exported for testing)
export { createLogger, logDebug, logWarn, logError } from './utils';
