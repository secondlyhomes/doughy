/**
 * Notification Service
 *
 * Handles:
 * - Token registration/unregistration
 * - Sending notifications via Edge Function
 * - Scheduling local notifications
 * - Notification history logging
 */

import { supabase } from '@/services/supabaseClient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  SendNotificationRequest,
  BatchNotificationRequest,
  ScheduleNotificationRequest,
  RegisterTokenRequest,
  PushToken,
  NotificationLog,
  NotificationTrigger,
  NotificationErrorCode,
  NotificationError,
  DevicePlatform,
  ExpoPushMessage,
} from './types';

// ============================================================================
// Token Management
// ============================================================================

/**
 * Register push token in database
 */
export async function registerPushToken(
  request: RegisterTokenRequest
): Promise<PushToken> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new NotificationError(
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      'User not authenticated'
    );
  }

  try {
    // Deactivate old tokens for this device
    await supabase
      .from('push_tokens')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('device_platform', request.devicePlatform);

    // Insert new token
    const { data, error } = await supabase
      .from('push_tokens')
      .insert({
        user_id: user.id,
        token: request.token,
        device_platform: request.devicePlatform,
        device_name: request.deviceName,
        app_version: request.appVersion,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to register push token:', error);
    throw new NotificationError(
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      'Failed to register push token',
      error
    );
  }
}

/**
 * Unregister push token (mark as inactive)
 */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .update({ status: 'inactive' })
      .eq('token', token);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    throw new NotificationError(
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      'Failed to unregister push token',
      error
    );
  }
}

/**
 * Get active push tokens for user(s)
 */
export async function getUserPushTokens(
  userId: string | string[]
): Promise<PushToken[]> {
  const userIds = Array.isArray(userId) ? userId : [userId];

  const { data, error } = await supabase
    .from('push_tokens')
    .select('*')
    .in('user_id', userIds)
    .eq('status', 'active');

  if (error) {
    console.error('Failed to get push tokens:', error);
    return [];
  }

  return data || [];
}

/**
 * Update token last used timestamp
 */
export async function updateTokenLastUsed(tokenId: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId);
}

// ============================================================================
// Sending Notifications
// ============================================================================

/**
 * Send notification to single user via Edge Function
 */
export async function sendNotification(
  request: SendNotificationRequest
): Promise<void> {
  try {
    // Get user's active push tokens
    const tokens = await getUserPushTokens(request.userId);

    if (tokens.length === 0) {
      console.warn('No active push tokens for user:', request.userId);
      return;
    }

    // Build Expo push message
    const message: ExpoPushMessage = {
      to: tokens.map((t) => t.token),
      title: request.notification.title,
      subtitle: request.notification.subtitle,
      body: request.notification.body,
      data: request.notification.data,
      sound: request.notification.sound === false ? null : (request.notification.sound as string) || 'default',
      badge: request.notification.badge,
      channelId: request.notification.channelId,
      categoryId: request.notification.categoryId,
      priority: request.notification.priority || 'default',
      ttl: 3600, // 1 hour
    };

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke(
      'send-notification',
      {
        body: {
          message,
          userId: request.userId,
          scheduledFor: request.scheduledFor?.toISOString(),
        },
      }
    );

    if (error) throw error;

    // Log notification
    await logNotification({
      user_id: request.userId,
      title: request.notification.title,
      body: request.notification.body,
      data: request.notification.data,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw new NotificationError(
      NotificationErrorCode.SEND_FAILED,
      'Failed to send notification',
      error
    );
  }
}

/**
 * Send notification to multiple users (batch)
 */
export async function sendBatchNotifications(
  request: BatchNotificationRequest
): Promise<void> {
  try {
    // Get all user tokens
    const tokens = await getUserPushTokens(request.userIds);

    if (tokens.length === 0) {
      console.warn('No active push tokens for any users');
      return;
    }

    // Build Expo push message
    const message: ExpoPushMessage = {
      to: tokens.map((t) => t.token),
      title: request.notification.title,
      subtitle: request.notification.subtitle,
      body: request.notification.body,
      data: request.notification.data,
      sound: request.notification.sound === false ? null : (request.notification.sound as string) || 'default',
      badge: request.notification.badge,
      channelId: request.notification.channelId,
      categoryId: request.notification.categoryId,
      priority: request.notification.priority || 'default',
    };

    // Call Edge Function (handles batching)
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        message,
        userIds: request.userIds,
        scheduledFor: request.scheduledFor?.toISOString(),
      },
    });

    if (error) throw error;

    // Log notifications for each user
    await Promise.all(
      request.userIds.map((userId) =>
        logNotification({
          user_id: userId,
          title: request.notification.title,
          body: request.notification.body,
          data: request.notification.data,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
      )
    );
  } catch (error) {
    console.error('Failed to send batch notifications:', error);
    throw new NotificationError(
      NotificationErrorCode.SEND_FAILED,
      'Failed to send batch notifications',
      error
    );
  }
}

// ============================================================================
// Local Scheduling
// ============================================================================

/**
 * Schedule local notification
 */
export async function scheduleLocalNotification(
  request: ScheduleNotificationRequest
): Promise<string> {
  try {
    const trigger = convertTriggerToExpo(request.trigger);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: request.notification.title,
        subtitle: request.notification.subtitle,
        body: request.notification.body,
        data: request.notification.data || {},
        sound: request.notification.sound === false ? undefined : (request.notification.sound as string) || 'default',
        badge: request.notification.badge,
      },
      trigger,
      identifier: request.identifier,
    });

    return identifier;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    throw new NotificationError(
      NotificationErrorCode.SCHEDULING_FAILED,
      'Failed to schedule notification',
      error
    );
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(
  identifier: string
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Set app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Failed to set badge count:', error);
  }
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Failed to clear badge:', error);
  }
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Failed to get badge count:', error);
    return 0;
  }
}

// ============================================================================
// Notification History
// ============================================================================

/**
 * Log notification in database
 */
async function logNotification(
  log: Omit<NotificationLog, 'id' | 'created_at'>
): Promise<void> {
  try {
    await supabase.from('notifications').insert(log);
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationDelivered(
  notificationId: string
): Promise<void> {
  await supabase
    .from('notifications')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  await supabase
    .from('notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Get notification history for user
 */
export async function getNotificationHistory(
  userId: string,
  limit = 50
): Promise<NotificationLog[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get notification history:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert notification trigger to Expo format
 */
function convertTriggerToExpo(
  trigger: NotificationTrigger
): Notifications.NotificationTriggerInput {
  switch (trigger.type) {
    case 'time':
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      };

    case 'timeInterval':
      return {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: trigger.repeats || false,
      };

    case 'daily':
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: trigger.hour,
        minute: trigger.minute,
      };

    case 'weekly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: trigger.weekday,
        hour: trigger.hour,
        minute: trigger.minute,
      };

    case 'calendar':
      return {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        year: trigger.year,
        month: trigger.month,
        day: trigger.day,
        hour: trigger.hour,
        minute: trigger.minute,
        repeats: trigger.repeats || false,
      };

    default:
      throw new Error('Invalid trigger type');
  }
}

/**
 * Get device info for token registration
 */
export function getDeviceInfo(): Pick<
  RegisterTokenRequest,
  'devicePlatform' | 'deviceName' | 'appVersion'
> {
  return {
    devicePlatform: Device.osName?.toLowerCase() as DevicePlatform,
    deviceName: Device.deviceName || undefined,
    appVersion: Constants.expoConfig?.version || undefined,
  };
}
