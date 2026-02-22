// src/utils/notification-types.ts
// Type definitions for the notifications module

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResponse {
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
export type NotificationsModule = {
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
