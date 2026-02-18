// src/utils/notifications.ts
// Safe wrapper for expo-notifications that provides mocks when native module is unavailable (Expo Go)

import Constants from 'expo-constants';
import { Platform } from 'react-native';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// Try to import expo-device, fallback to mock if not available
let Device: { isDevice: boolean } | null = null;
try {
  Device = require('expo-device');
} catch {
  // expo-device not installed, will use fallback
  if (__DEV__) {
    console.info('[Notifications] expo-device not available, assuming physical device for dev');
  }
}

interface PermissionResponse {
  status: PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

/**
 * Notification content structure
 */
export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean | string;
  badge?: number;
}

/**
 * Push token registration result
 */
export interface PushTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

// Type for the expo-notifications module
type NotificationsModule = {
  getPermissionsAsync: () => Promise<PermissionResponse>;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
  getExpoPushTokenAsync: (options?: { projectId?: string }) => Promise<{ data: string }>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  scheduleNotificationAsync: (request: {
    content: NotificationContent;
    trigger: { seconds: number } | null;
  }) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  getBadgeCountAsync: () => Promise<number>;
  setBadgeCountAsync: (count: number) => Promise<void>;
  addNotificationReceivedListener: (listener: (notification: unknown) => void) => { remove: () => void };
  addNotificationResponseReceivedListener: (listener: (response: unknown) => void) => { remove: () => void };
};

let Notifications: NotificationsModule | null = null;

try {
  // Attempt to import expo-notifications
  // This will throw if the native module isn't available (e.g., in Expo Go)
  Notifications = require('expo-notifications');
} catch {
  // Native module not available - will use mocks below
  // This is expected in Expo Go; use a development build for real notifications
  if (__DEV__) {
    console.info('[Notifications] Using mock implementation (Expo Go detected). Build a development build for real push notifications.');
  }
}

/**
 * Check if we're running on a physical device (required for push notifications)
 */
export function isPhysicalDevice(): boolean {
  // If expo-device isn't available, assume physical device in dev mode
  return Device?.isDevice ?? true;
}

/**
 * Check if push notifications are available on this device
 */
export function isPushNotificationsAvailable(): boolean {
  return isPhysicalDevice() && Notifications !== null;
}

/**
 * Get current notification permissions
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (Notifications) {
    return Notifications.getPermissionsAsync();
  }
  // Mock: Return undetermined in Expo Go
  return {
    status: 'undetermined',
    canAskAgain: true,
    granted: false,
  };
}

/**
 * Request notification permissions from the user
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (Notifications) {
    return Notifications.requestPermissionsAsync();
  }
  // Mock: Simulate permission grant in Expo Go for development
  if (__DEV__) {
    console.info('[Notifications] Simulating permission request (mock mode)');
  }
  return {
    status: 'granted',
    canAskAgain: true,
    granted: true,
  };
}

/**
 * Configure how notifications should be handled when received
 * Call this early in your app initialization
 *
 * @example
 * ```typescript
 * // In App.tsx or _layout.tsx
 * configureNotificationHandler({
 *   shouldShowAlert: true,
 *   shouldPlaySound: true,
 *   shouldSetBadge: true,
 * });
 * ```
 */
export function configureNotificationHandler(options: {
  shouldShowAlert?: boolean;
  shouldPlaySound?: boolean;
  shouldSetBadge?: boolean;
} = {}): void {
  if (!Notifications) {
    if (__DEV__) {
      console.info('[Notifications] Mock: Notification handler configured');
    }
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: options.shouldShowAlert ?? true,
      shouldPlaySound: options.shouldPlaySound ?? true,
      shouldSetBadge: options.shouldSetBadge ?? false,
    }),
  });
}

/**
 * Register for push notifications and get the Expo push token
 * This token should be saved to your backend to send push notifications
 *
 * @example
 * ```typescript
 * const result = await registerForPushNotificationsAsync();
 * if (result.success && result.token) {
 *   // Save token to your backend
 *   await saveUserPushToken(userId, result.token);
 * }
 * ```
 */
export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
  // Check if we're on a physical device
  if (!isPhysicalDevice()) {
    return {
      success: false,
      error: 'Push notifications require a physical device',
    };
  }

  // Check if the module is available
  if (!Notifications) {
    if (__DEV__) {
      // Return mock token in dev mode
      return {
        success: true,
        token: 'ExponentPushToken[MOCK_TOKEN_FOR_DEVELOPMENT]',
      };
    }
    return {
      success: false,
      error: 'Notifications module not available. Use a development build.',
    };
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Check if permissions were granted
    if (finalStatus !== 'granted') {
      return {
        success: false,
        error: 'Permission to receive push notifications was denied',
      };
    }

    // Get the project ID from Expo config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android notification channel if needed
    if (Platform.OS === 'android') {
      await configureAndroidChannel();
    }

    return {
      success: true,
      token: tokenData.data,
    };
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register for push notifications',
    };
  }
}

/**
 * Configure Android notification channel (required for Android)
 */
async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;

  try {
    // Import the Android channel API
    const { setNotificationChannelAsync } = require('expo-notifications');

    await setNotificationChannelAsync('default', {
      name: 'Default',
      importance: 4, // MAX importance
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  } catch (error) {
    console.warn('[Notifications] Failed to configure Android channel:', error);
  }
}

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
