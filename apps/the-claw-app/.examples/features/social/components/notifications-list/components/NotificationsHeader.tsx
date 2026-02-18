/**
 * NotificationsHeader Component
 *
 * Displays unread count and "Mark all as read" action.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { NotificationsHeaderProps } from '../types';

/**
 * Header for the notifications list
 *
 * Shows unread count and provides a button to mark all notifications as read.
 * Only renders when there are unread notifications.
 */
export function NotificationsHeader({
  unreadCount,
  onMarkAllAsRead,
}: NotificationsHeaderProps) {
  if (unreadCount === 0) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
      </Text>
      <Pressable onPress={onMarkAllAsRead}>
        <Text style={styles.markAllRead}>Mark all as read</Text>
      </Pressable>
    </View>
  );
}
