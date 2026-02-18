/**
 * Notification Service
 *
 * Manages in-app notifications including:
 * - Creating notifications
 * - Fetching notifications
 * - Mark as read/unread
 * - Real-time updates
 */

import { supabase } from '@/services/supabase';
import type { Notification, NotificationType } from '../types';

/**
 * Create a notification
 *
 * @example
 * ```ts
 * await createNotification(
 *   userId,
 *   'follow',
 *   'New Follower',
 *   'John Doe started following you',
 *   { followerId: 'abc123' }
 * );
 * ```
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return notification;
}

/**
 * Get notifications for a user
 *
 * Returns notifications with actor profile data if available.
 *
 * @example
 * ```ts
 * const notifications = await getNotifications(userId, 0, 20);
 * ```
 */
export async function getNotifications(
  userId: string,
  offset = 0,
  limit = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data || []) as Notification[];
}

/**
 * Get unread notifications count
 *
 * @example
 * ```ts
 * const count = await getUnreadCount(userId);
 * setBadgeCount(count);
 * ```
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Mark notification as read
 *
 * @example
 * ```ts
 * await markAsRead(notificationId);
 * ```
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 *
 * @example
 * ```ts
 * await markAllAsRead(userId);
 * ```
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 *
 * @example
 * ```ts
 * await deleteNotification(notificationId);
 * ```
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 *
 * @example
 * ```ts
 * await deleteAllNotifications(userId);
 * ```
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time notification updates
 *
 * Sets up a real-time subscription for new notifications.
 * Call the returned function to unsubscribe.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToNotifications(userId, {
 *   onInsert: (notification) => {
 *     showToast(notification.title);
 *   },
 *   onUpdate: (notification) => {
 *     updateNotificationsList(notification);
 *   }
 * });
 *
 * // Later, clean up
 * unsubscribe();
 * ```
 */
export function subscribeToNotifications(
  userId: string,
  callbacks: {
    onInsert?: (notification: Notification) => void;
    onUpdate?: (notification: Notification) => void;
    onDelete?: (notificationId: string) => void;
  }
): () => void {
  const channel = supabase.channel('notifications');

  if (callbacks.onInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onInsert?.(payload.new as Notification);
      }
    );
  }

  if (callbacks.onUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onUpdate?.(payload.new as Notification);
      }
    );
  }

  if (callbacks.onDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callbacks.onDelete?.(payload.old.id);
      }
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Batch create notifications
 *
 * Useful for notifying multiple users at once.
 *
 * @example
 * ```ts
 * await batchCreateNotifications([
 *   { userId: 'user1', type: 'like', title: 'New Like', message: '...' },
 *   { userId: 'user2', type: 'like', title: 'New Like', message: '...' }
 * ]);
 * ```
 */
export async function batchCreateNotifications(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }>
): Promise<void> {
  const { error } = await supabase.from('notifications').insert(
    notifications.map((n) => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || null,
      read: false,
    }))
  );

  if (error) {
    console.error('Error batch creating notifications:', error);
    throw error;
  }
}
