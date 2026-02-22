// src/utils/notification-permissions.ts
// Permission handling functions for push notifications

import type { PermissionResponse } from './notification-types';
import { getNotificationsModule } from './notification-module';

/**
 * Get current notification permissions
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  const Notifications = getNotificationsModule();

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
  const Notifications = getNotificationsModule();

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
