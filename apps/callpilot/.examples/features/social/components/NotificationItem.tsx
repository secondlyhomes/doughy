/**
 * Notification Item Component
 *
 * Displays a single notification with read/unread state.
 */

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/theme/tokens';
import type { Notification } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onDelete?: (notificationId: string) => void;
}

/**
 * Notification Item
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   notification={notification}
 *   onPress={(n) => handleNotificationPress(n)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 */
export function NotificationItem({ notification, onPress, onDelete }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '@';
      case 'system':
        return '🔔';
      default:
        return '•';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  };

  return (
    <Pressable
      style={[styles.container, !notification.read && styles.containerUnread]}
      onPress={() => onPress?.(notification)}
    >
      {!notification.read && <View style={styles.unreadDot} />}

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIcon()}</Text>
      </View>

      {notification.actor?.avatar_url && (
        <Image
          source={{ uri: notification.actor.avatar_url }}
          style={styles.avatar}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>{getTimeAgo(notification.created_at)}</Text>
      </View>

      {onDelete && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(notification.id)}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  containerUnread: {
    backgroundColor: colors.primary[50],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginRight: spacing[3],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  icon: {
    fontSize: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing[1],
    lineHeight: 18,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  deleteText: {
    fontSize: 28,
    color: colors.neutral[400],
    fontWeight: '300',
    lineHeight: 28,
  },
});
