// src/utils/notification-registration.ts
// Push notification registration and handler configuration

import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { PushTokenResult } from './notification-types';
import { getNotificationsModule, isPhysicalDevice } from './notification-module';

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
  const Notifications = getNotificationsModule();

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
 * Configure Android notification channel (required for Android)
 */
async function configureAndroidChannel(): Promise<void> {
  const Notifications = getNotificationsModule();
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
  const Notifications = getNotificationsModule();

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
