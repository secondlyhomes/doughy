/**
 * Types for NotificationsList component
 */

import type { Notification } from '../../types';

/**
 * Props for the main NotificationsList component
 */
export interface NotificationsListProps {
  onNotificationPress?: (notification: Notification) => void;
}

/**
 * Props for the NotificationsHeader component
 */
export interface NotificationsHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
}

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  loading: boolean;
  hasNotifications: boolean;
}

/**
 * Props for the ErrorState component
 */
export interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

/**
 * Props for the LoadingFooter component
 */
export interface LoadingFooterProps {
  loading: boolean;
}
