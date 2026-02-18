/**
 * Activity Feed Provider
 *
 * Provides activity feed functionality with real-time updates.
 *
 * @example
 * ```tsx
 * <ActivityFeedProvider currentUserId={user?.id} enableRealtime>
 *   <App />
 * </ActivityFeedProvider>
 * ```
 */

import React, { createContext, useState, useEffect } from 'react';
import type { ActivityFeedProviderProps, ActivityFeedItem, ActivityFeedContextValue } from './types';
import { useActivityFeedActions } from './hooks/useActivityFeedActions';
import * as activityService from '../../services/activityService';

export const ActivityFeedContext = createContext<ActivityFeedContextValue | undefined>(undefined);

/**
 * Activity Feed Provider Component
 *
 * Manages activity feed state including:
 * - Loading activities
 * - Real-time updates
 * - Pagination
 * - Creating activities
 */
export function ActivityFeedProvider({
  children,
  currentUserId,
  enableRealtime = true,
}: ActivityFeedProviderProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const {
    loadActivities,
    refreshActivities,
    createActivity,
    handleActivityInsert,
    handleActivityUpdate,
    handleActivityDelete,
  } = useActivityFeedActions({
    currentUserId,
    setActivities,
    setLoading,
    setError,
    setHasMore,
  });

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!currentUserId || !enableRealtime) {
      return;
    }

    const unsubscribe = activityService.subscribeToActivityFeed(
      currentUserId,
      handleActivityInsert,
      handleActivityUpdate,
      handleActivityDelete
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, enableRealtime, handleActivityInsert, handleActivityUpdate, handleActivityDelete]);

  /**
   * Load initial activities
   */
  useEffect(() => {
    if (currentUserId) {
      loadActivities(0, 20);
    }
  }, [currentUserId, loadActivities]);

  const value: ActivityFeedContextValue = {
    activities,
    loading,
    error,
    hasMore,
    loadActivities,
    refreshActivities,
    createActivity,
  };

  return (
    <ActivityFeedContext.Provider value={value}>
      {children}
    </ActivityFeedContext.Provider>
  );
}
