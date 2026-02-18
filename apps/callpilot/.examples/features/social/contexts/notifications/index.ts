/**
 * Notifications Context
 *
 * Manages in-app notifications including:
 * - Loading notifications with pagination
 * - Real-time updates
 * - Mark as read/unread
 * - Unread count tracking
 *
 * @example
 * ```tsx
 * // In app root
 * import { NotificationsProvider } from './contexts/notifications';
 *
 * <NotificationsProvider currentUserId={user?.id} enableRealtime>
 *   <App />
 * </NotificationsProvider>
 *
 * // In components
 * import { useNotifications } from './contexts/notifications';
 *
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 * ```
 */

// Provider
export { NotificationsProvider } from './NotificationsProvider';

// Consumer hook
export { useNotifications } from './useNotifications';

// Types
export type {
  NotificationsProviderProps,
  NotificationsState,
  NotificationQueryOperations,
  NotificationMutationOperations,
  NotificationRealtimeHandlers,
  NotificationsContextValue,
} from './types';

// Internal hooks (for advanced use cases)
export { useNotificationQueries } from './hooks/useNotificationQueries';
export { useNotificationMutations } from './hooks/useNotificationMutations';
