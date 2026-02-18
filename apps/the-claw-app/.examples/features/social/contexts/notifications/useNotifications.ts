/**
 * useNotifications Hook
 *
 * Consumer hook for accessing the notifications context.
 */

import { useContext } from 'react';
import { NotificationsContext } from './NotificationsProvider';
import type { NotificationsContextValue } from '../../types';

/**
 * Hook to access notifications context
 *
 * @throws Error if used outside NotificationsProvider
 *
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const { unreadCount } = useNotifications();
 *
 *   if (unreadCount === 0) return null;
 *
 *   return (
 *     <View style={styles.badge}>
 *       <Text>{unreadCount}</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function NotificationsList() {
 *   const {
 *     notifications,
 *     loading,
 *     hasMore,
 *     loadNotifications,
 *     markAsRead,
 *     refreshNotifications,
 *   } = useNotifications();
 *
 *   const handleLoadMore = () => {
 *     if (hasMore && !loading) {
 *       loadNotifications(notifications.length);
 *     }
 *   };
 *
 *   return (
 *     <FlatList
 *       data={notifications}
 *       onEndReached={handleLoadMore}
 *       refreshing={loading}
 *       onRefresh={refreshNotifications}
 *       renderItem={({ item }) => (
 *         <NotificationItem
 *           notification={item}
 *           onPress={() => markAsRead(item.id)}
 *         />
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
}
