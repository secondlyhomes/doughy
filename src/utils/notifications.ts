// src/utils/notifications.ts
// Safe wrapper for expo-notifications that provides mocks when native module is unavailable (Expo Go)

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionResponse {
  status: PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

let Notifications: {
  getPermissionsAsync: () => Promise<PermissionResponse>;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
} | null = null;

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
