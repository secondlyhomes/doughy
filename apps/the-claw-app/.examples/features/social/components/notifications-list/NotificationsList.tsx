/**
 * Notifications List Component
 *
 * Complete notifications list with real-time updates and mark as read.
 */

import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useNotifications } from '../../contexts/NotificationsContext';
import { NotificationItem } from '../NotificationItem';
import {
  EmptyState,
  ErrorState,
  LoadingFooter,
  NotificationsHeader,
} from './components';
import { styles, colors } from './styles';
import type { NotificationsListProps } from './types';
import type { Notification } from '../../types';

/**
 * Notifications List
 *
 * @example
 * ```tsx
 * <NotificationsList
 *   onNotificationPress={(n) => handleNotificationPress(n)}
 * />
 * ```
 */
export function NotificationsList({
  onNotificationPress,
}: NotificationsListProps) {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    error,
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(notifications.length, 20);
    }
  };

  const handlePress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={handlePress}
      onDelete={deleteNotification}
    />
  );

  const renderHeader = () => (
    <NotificationsHeader
      unreadCount={unreadCount}
      onMarkAllAsRead={markAllAsRead}
    />
  );

  const renderFooter = () => <LoadingFooter loading={loading} />;

  const renderEmpty = () => (
    <EmptyState loading={loading} hasNotifications={notifications.length > 0} />
  );

  // Error state (only when no cached notifications)
  if (error && notifications.length === 0) {
    return (
      <ErrorState
        errorMessage={error.message}
        onRetry={refreshNotifications}
      />
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary[500]}
        />
      }
      contentContainerStyle={
        notifications.length === 0 ? styles.emptyContainer : undefined
      }
    />
  );
}
