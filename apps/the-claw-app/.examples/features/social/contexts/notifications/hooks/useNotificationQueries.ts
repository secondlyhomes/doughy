/**
 * Notification Query Operations Hook
 *
 * Handles fetching notifications and unread count with pagination support.
 */

import { useCallback } from 'react';
import * as notificationService from '../../../services/notificationService';
import type { Notification } from '../../../types';
import type { NotificationsStateSetters, NotificationQueryOperations } from '../types';

interface UseNotificationQueriesParams {
  currentUserId?: string;
  setters: NotificationsStateSetters;
}

/**
 * Hook for notification query operations
 *
 * Provides loadNotifications, loadUnreadCount, and refreshNotifications functions.
 *
 * @example
 * ```ts
 * const queries = useNotificationQueries({
 *   currentUserId: user?.id,
 *   setters: { setNotifications, setUnreadCount, setLoading, setError, setHasMore }
 * });
 *
 * await queries.loadNotifications(0, 20);
 * ```
 */
export function useNotificationQueries({
  currentUserId,
  setters,
}: UseNotificationQueriesParams): NotificationQueryOperations {
  const { setNotifications, setUnreadCount, setLoading, setError, setHasMore } = setters;

  /**
   * Load notifications with pagination
   */
  const loadNotifications = useCallback(
    async (offset = 0, limit = 20) => {
      if (!currentUserId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await notificationService.getNotifications(currentUserId, offset, limit);

        if (offset === 0) {
          setNotifications(data);
        } else {
          setNotifications((prev: Notification[]) => [...prev, ...data]);
        }

        setHasMore(data.length === limit);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load notifications');
        setError(error);
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, setNotifications, setLoading, setError, setHasMore]
  );

  /**
   * Load unread notification count
   */
  const loadUnreadCount = useCallback(async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const count = await notificationService.getUnreadCount(currentUserId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [currentUserId, setUnreadCount]);

  /**
   * Refresh notifications (reload from beginning)
   */
  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(0, 20), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  return {
    loadNotifications,
    loadUnreadCount,
    refreshNotifications,
  };
}
