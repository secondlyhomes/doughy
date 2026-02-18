/**
 * Notification Mutation Operations Hook
 *
 * Handles modifying notifications: mark as read, delete, etc.
 */

import { useCallback } from 'react';
import * as notificationService from '../../../services/notificationService';
import type { Notification } from '../../../types';
import type { NotificationsStateSetters, NotificationMutationOperations } from '../types';

interface UseNotificationMutationsParams {
  currentUserId?: string;
  setters: NotificationsStateSetters;
}

/**
 * Hook for notification mutation operations
 *
 * Provides markAsRead, markAllAsRead, and deleteNotification functions.
 *
 * @example
 * ```ts
 * const mutations = useNotificationMutations({
 *   currentUserId: user?.id,
 *   setters: { setNotifications, setUnreadCount, setError, ... }
 * });
 *
 * await mutations.markAsRead(notificationId);
 * ```
 */
export function useNotificationMutations({
  currentUserId,
  setters,
}: UseNotificationMutationsParams): NotificationMutationOperations {
  const { setNotifications, setUnreadCount, setError } = setters;

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId);

        // Update local state
        setNotifications((prev: Notification[]) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to mark as read');
        setError(error);
        throw error;
      }
    },
    [setNotifications, setUnreadCount, setError]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) {
      return;
    }

    try {
      await notificationService.markAllAsRead(currentUserId);

      // Update local state
      setNotifications((prev: Notification[]) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark all as read');
      setError(error);
      throw error;
    }
  }, [currentUserId, setNotifications, setUnreadCount, setError]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);

        // Update local state
        setNotifications((prev: Notification[]) => {
          const notification = prev.find((n) => n.id === notificationId);
          if (notification && !notification.read) {
            setUnreadCount((count: number) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete notification');
        setError(error);
        throw error;
      }
    },
    [setNotifications, setUnreadCount, setError]
  );

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
