/**
 * Activity Feed Actions Hook
 *
 * Provides action handlers for loading, refreshing, and creating activities.
 * Also provides real-time event handlers for subscription updates.
 */

import { useCallback } from 'react';
import type { ActivityFeedItem, ActivityType } from '../types';
import type { ActivityFeedActions, ActivityFeedRealtimeHandlers } from '../types';
import * as activityService from '../../../services/activityService';

interface UseActivityFeedActionsParams {
  currentUserId: string | undefined;
  setActivities: React.Dispatch<React.SetStateAction<ActivityFeedItem[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseActivityFeedActionsResult extends ActivityFeedActions, ActivityFeedRealtimeHandlers {}

/**
 * Hook that provides all activity feed actions
 *
 * @param params - State setters and current user ID
 * @returns Activity feed actions and real-time handlers
 */
export function useActivityFeedActions({
  currentUserId,
  setActivities,
  setLoading,
  setError,
  setHasMore,
}: UseActivityFeedActionsParams): UseActivityFeedActionsResult {
  /**
   * Load activities with pagination
   */
  const loadActivities = useCallback(
    async (offset = 0, limit = 20) => {
      if (!currentUserId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await activityService.getActivityFeed(currentUserId, offset, limit);

        if (offset === 0) {
          setActivities(data);
        } else {
          setActivities((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === limit);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load activities');
        setError(error);
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, setActivities, setLoading, setError, setHasMore]
  );

  /**
   * Refresh activities (reload from beginning)
   */
  const refreshActivities = useCallback(async () => {
    await loadActivities(0, 20);
  }, [loadActivities]);

  /**
   * Create a new activity
   */
  const createActivity = useCallback(
    async (type: ActivityType, content?: Record<string, any>) => {
      if (!currentUserId) {
        throw new Error('Not authenticated');
      }

      try {
        const activity = await activityService.createActivity(
          currentUserId,
          currentUserId,
          type,
          content
        );

        // Optimistically add to feed
        setActivities((prev) => [activity, ...prev]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create activity');
        setError(error);
        throw error;
      }
    },
    [currentUserId, setActivities, setError]
  );

  /**
   * Handle real-time activity insert
   */
  const handleActivityInsert = useCallback((newActivity: ActivityFeedItem) => {
    setActivities((prev) => {
      // Check if activity already exists (avoid duplicates)
      if (prev.some((a) => a.id === newActivity.id)) {
        return prev;
      }
      return [newActivity, ...prev];
    });
  }, [setActivities]);

  /**
   * Handle real-time activity update
   */
  const handleActivityUpdate = useCallback((updatedActivity: ActivityFeedItem) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a))
    );
  }, [setActivities]);

  /**
   * Handle real-time activity delete
   */
  const handleActivityDelete = useCallback((activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  }, [setActivities]);

  return {
    loadActivities,
    refreshActivities,
    createActivity,
    handleActivityInsert,
    handleActivityUpdate,
    handleActivityDelete,
  };
}
