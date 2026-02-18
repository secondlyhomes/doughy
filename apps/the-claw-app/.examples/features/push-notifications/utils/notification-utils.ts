/**
 * Notification Utilities
 *
 * Helper functions for push notification handling.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NotificationPayload, NotificationResponse, PermissionStatus } from '../types';
import { registerPushToken, getDeviceInfo } from '../notificationService';

/**
 * Configure default notification behavior (foreground display)
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Setup notification categories with action buttons (iOS)
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('message', [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      options: { opensAppToForeground: true },
      textInput: { submitButtonTitle: 'Send', placeholder: 'Type a message...' },
    },
    { identifier: 'view', buttonTitle: 'View', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync('task', [
    { identifier: 'complete', buttonTitle: 'Complete', options: { opensAppToForeground: false } },
    { identifier: 'view', buttonTitle: 'View', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync('social', [
    { identifier: 'like', buttonTitle: 'Like', options: { opensAppToForeground: false } },
    { identifier: 'view', buttonTitle: 'View', options: { opensAppToForeground: true } },
  ]);

  await Notifications.setNotificationCategoryAsync('reminder', [
    { identifier: 'dismiss', buttonTitle: 'Dismiss', options: { opensAppToForeground: false } },
    { identifier: 'view', buttonTitle: 'View', options: { opensAppToForeground: true } },
  ]);
}

/**
 * Parse Expo notification to NotificationPayload
 */
export function parseNotificationPayload(notification: Notifications.Notification): NotificationPayload {
  return {
    title: notification.request.content.title || '',
    body: notification.request.content.body || '',
    subtitle: notification.request.content.subtitle,
    data: notification.request.content.data as any,
    badge: notification.request.content.badge || undefined,
    sound: notification.request.content.sound || undefined,
  };
}

/**
 * Parse Expo notification response to NotificationResponse
 */
export function parseNotificationResponse(response: Notifications.NotificationResponse): NotificationResponse {
  return {
    notification: response.notification as any,
    actionIdentifier: response.actionIdentifier,
    userText: (response as any).userText,
  };
}

/**
 * Request permissions without context
 */
export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  if (!Device.isDevice) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status as PermissionStatus;
}

/**
 * Get current permission status without context
 */
export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

/**
 * Register for push notifications without context (one-time setup)
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission not granted for push notifications');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const token = tokenData.data;
    await registerPushToken({ token, ...getDeviceInfo() });
    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}
