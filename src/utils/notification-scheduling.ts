// src/utils/notification-scheduling.ts
// Local notification scheduling, badge management, listeners, and push sending

import type { NotificationContent } from './notification-types';
import { getNotificationsModule } from './notification-module';

/**
 * Send a local notification immediately or after a delay
 *
 * @example
 * ```typescript
 * // Immediate notification
 * await sendLocalNotification({
 *   title: 'New Lead!',
 *   body: 'You have a new lead from 123 Main St',
 *   data: { leadId: '123' },
 * });
 *
 * // Delayed notification (5 seconds)
 * await sendLocalNotification(
 *   { title: 'Reminder', body: 'Follow up with seller' },
 *   5
 * );
 * ```
 */
export async function sendLocalNotification(
  content: NotificationContent,
  delaySeconds: number = 0
): Promise<string | null> {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    if (__DEV__) {
      console.info('[Notifications] Mock: Local notification scheduled', content);
    }
    return `mock-notification-${Date.now()}`;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data || {},
        sound: content.sound ?? true,
        badge: content.badge,
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });

    return identifier;
  } catch (error) {
    console.error('[Notifications] Failed to send local notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification by its identifier
 */
export async function cancelNotification(identifier: string): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('[Notifications] Failed to cancel notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Failed to cancel all notifications:', error);
  }
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return 0;

  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Set the app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('[Notifications] Failed to set badge count:', error);
  }
}

/**
 * Add a listener for when a notification is received while the app is foregrounded
 *
 * @example
 * ```typescript
 * const unsubscribe = addNotificationReceivedListener((notification) => {
 *   console.log('Received notification:', notification);
 * });
 *
 * // Later: unsubscribe();
 * ```
 */
export function addNotificationReceivedListener(
  listener: (notification: unknown) => void
): () => void {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return () => {}; // No-op cleanup function
  }

  const subscription = Notifications.addNotificationReceivedListener(listener);
  return () => subscription.remove();
}

/**
 * Add a listener for when the user interacts with a notification
 *
 * @example
 * ```typescript
 * const unsubscribe = addNotificationResponseListener((response) => {
 *   const data = response.notification.request.content.data;
 *   if (data.leadId) {
 *     navigation.navigate('LeadDetail', { id: data.leadId });
 *   }
 * });
 * ```
 */
export function addNotificationResponseListener(
  listener: (response: unknown) => void
): () => void {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return () => {}; // No-op cleanup function
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(listener);
  return () => subscription.remove();
}

/**
 * Send a push notification via Expo's push service
 * This should typically be called from your backend, not the client
 * Included here for completeness and testing purposes
 *
 * @example
 * ```typescript
 * // Usually called from Edge Function, not client
 * await sendExpoPushNotification(
 *   'ExponentPushToken[xxx]',
 *   { title: 'New Message', body: 'You have a new message' }
 * );
 * ```
 */
export async function sendExpoPushNotification(
  pushToken: string,
  content: NotificationContent
): Promise<boolean> {
  try {
    const message = {
      to: pushToken,
      sound: content.sound ?? 'default',
      title: content.title,
      body: content.body,
      data: content.data || {},
      badge: content.badge,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result.data?.status === 'ok';
  } catch (error) {
    console.error('[Notifications] Failed to send push notification:', error);
    return false;
  }
}
