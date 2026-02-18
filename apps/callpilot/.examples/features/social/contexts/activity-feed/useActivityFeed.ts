/**
 * Activity Feed Consumer Hook
 *
 * Provides access to the activity feed context.
 *
 * @example
 * ```tsx
 * function FeedScreen() {
 *   const { activities, loading, loadActivities, hasMore } = useActivityFeed();
 *
 *   const loadMore = () => {
 *     if (hasMore && !loading) {
 *       loadActivities(activities.length, 20);
 *     }
 *   };
 *
 *   return (
 *     <FlatList
 *       data={activities}
 *       onEndReached={loadMore}
 *       renderItem={({ item }) => <FeedItem activity={item} />}
 *     />
 *   );
 * }
 * ```
 */

import { useContext } from 'react';
import { ActivityFeedContext } from './ActivityFeedProvider';
import type { ActivityFeedContextValue } from './types';

/**
 * Hook to access activity feed context
 *
 * @throws Error if used outside ActivityFeedProvider
 * @returns The activity feed context value
 */
export function useActivityFeed(): ActivityFeedContextValue {
  const context = useContext(ActivityFeedContext);
  if (!context) {
    throw new Error('useActivityFeed must be used within ActivityFeedProvider');
  }
  return context;
}
