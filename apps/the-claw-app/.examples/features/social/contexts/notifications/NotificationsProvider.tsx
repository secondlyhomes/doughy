/**
 * Notifications Provider
 *
 * Provides notification management with real-time updates.
 *
 * @example
 * ```tsx
 * <NotificationsProvider currentUserId={user?.id} enableRealtime>
 *   <App />
 * </NotificationsProvider>
 * ```
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { Notification, NotificationsContextValue } from '../../types';
import type { NotificationsProviderProps } from './types';
import { useNotificationQueries } from './hooks/useNotificationQueries';
import { useNotificationMutations } from './hooks/useNotificationMutations';
import * as notificationService from '../../services/notificationService';

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({
  children,
  currentUserId,
  enableRealtime = true,
}: NotificationsProviderProps) {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const setters = {
    setNotifications,
    setUnreadCount,
    setLoading,
    setError,
    setHasMore,
  };

  // Query operations
  const { loadNotifications, loadUnreadCount, refreshNotifications } = useNotificationQueries({
    currentUserId,
    setters,
  });

  // Mutation operations
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationMutations({
    currentUserId,
    setters,
  });

  // Real-time handlers
  const handleNotificationInsert = useCallback((newNotification: Notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotification.id)) {
        return prev;
      }
      return [newNotification, ...prev];
    });

    if (!newNotification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const handleNotificationUpdate = useCallback((updatedNotification: Notification) => {
    setNotifications((prev) => {
      const oldNotification = prev.find((n) => n.id === updatedNotification.id);

      if (oldNotification && oldNotification.read !== updatedNotification.read) {
        setUnreadCount((count) =>
          updatedNotification.read ? Math.max(0, count - 1) : count + 1
        );
      }

      return prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n));
    });
  }, []);

  const handleNotificationDelete = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUserId || !enableRealtime) {
      return;
    }

    const unsubscribe = notificationService.subscribeToNotifications(currentUserId, {
      onInsert: handleNotificationInsert,
      onUpdate: handleNotificationUpdate,
      onDelete: handleNotificationDelete,
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId, enableRealtime, handleNotificationInsert, handleNotificationUpdate, handleNotificationDelete]);

  // Load initial data
  useEffect(() => {
    if (currentUserId) {
      refreshNotifications();
    }
  }, [currentUserId, refreshNotifications]);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
