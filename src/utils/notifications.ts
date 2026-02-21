// src/utils/notifications.ts
// Barrel re-export — all notification utilities are split into focused modules.
// Import from '@/utils/notifications' still works for backward compatibility.

// Types
export type {
  PermissionStatus,
  PermissionResponse,
  NotificationContent,
  PushTokenResult,
  NotificationsModule,
} from './notification-types';

// Module singletons & device checks
export {
  isPhysicalDevice,
  isPushNotificationsAvailable,
} from './notification-module';

// Permissions
export {
  getPermissionsAsync,
  requestPermissionsAsync,
} from './notification-permissions';

// Registration & handler configuration
export {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
} from './notification-registration';

// Scheduling, badge, listeners, push sending
export {
  sendLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  sendExpoPushNotification,
} from './notification-scheduling';
