/**
 * Activity Feed Context
 *
 * Clean re-exports for the activity feed context module.
 */

// Provider component
export { ActivityFeedProvider } from './ActivityFeedProvider';

// Consumer hook
export { useActivityFeed } from './useActivityFeed';

// Types
export type {
  ActivityFeedProviderProps,
  ActivityFeedState,
  ActivityFeedActions,
  ActivityFeedRealtimeHandlers,
  ActivityFeedItem,
  ActivityType,
  ActivityFeedContextValue,
} from './types';

// Internal hooks (exported for testing or advanced use cases)
export { useActivityFeedActions } from './hooks/useActivityFeedActions';
