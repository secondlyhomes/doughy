/**
 * Notifications Context Types
 *
 * TypeScript interfaces for notifications state and operations.
 */

import type { ReactNode } from 'react';
import type { Notification } from '../../types';

/**
 * Props for NotificationsProvider component
 */
export interface NotificationsProviderProps {
  children: ReactNode;
  currentUserId?: string;
  enableRealtime?: boolean;
}

/**
 * Internal state managed by the notifications context
 */
export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
}

/**
 * Query operations for fetching notification data
 */
export interface NotificationQueryOperations {
  loadNotifications: (offset?: number, limit?: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Mutation operations for modifying notifications
 */
export interface NotificationMutationOperations {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

/**
 * Real-time event handlers for notification updates
 */
export interface NotificationRealtimeHandlers {
  handleNotificationInsert: (notification: Notification) => void;
  handleNotificationUpdate: (notification: Notification) => void;
  handleNotificationDelete: (notificationId: string) => void;
}

/**
 * State setters exposed by the state hook
 */
export interface NotificationsStateSetters {
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Public context value exposed to consumers
 *
 * Re-exported from shared types for consistency
 */
export type { NotificationsContextValue } from '../../types';
