// src/utils/notification-module.ts
// Shared singleton references for the notifications module
// These are loaded once at import time and shared across all notification utility files

import type { NotificationsModule } from './notification-types';

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
 * Get the shared Notifications module reference (may be null if unavailable)
 */
export function getNotificationsModule(): NotificationsModule | null {
  return Notifications;
}
