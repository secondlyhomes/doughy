/**
 * Push Notifications Module
 *
 * Export all push notification functionality
 */

// Context and hooks
export {
  PushNotificationsProvider,
  usePushNotifications,
} from './PushNotificationsContext';

export type { PushNotificationsProviderProps } from './PushNotificationsContext';

// Core hook (for use outside context)
export {
  usePushNotificationsCore,
} from './hooks/usePushNotifications';

export type {
  UsePushNotificationsOptions,
  UsePushNotificationsReturn,
} from './hooks/usePushNotifications';

// Utility functions
export {
  configureNotificationHandler,
  setupNotificationCategories,
  parseNotificationPayload,
  parseNotificationResponse,
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  registerForPushNotifications,
} from './utils/notification-utils';

// Service functions
export {
  registerPushToken,
  unregisterPushToken,
  getUserPushTokens,
  updateTokenLastUsed,
  sendNotification,
  sendBatchNotifications,
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
  setBadgeCount,
  clearBadge,
  getBadgeCount,
  markNotificationDelivered,
  markNotificationRead,
  getNotificationHistory,
  getDeviceInfo,
} from './notificationService';

// Types
export type {
  NotificationPayload,
  NotificationData,
  NotificationDeepLink,
  NotificationAttachment,
  NotificationPriority,
  NotificationCategory,
  NotificationAction,
  PushToken,
  RegisterTokenRequest,
  TokenStatus,
  DevicePlatform,
  NotificationLog,
  NotificationStatus,
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceipt,
  SendNotificationRequest,
  BatchNotificationRequest,
  ScheduleNotificationRequest,
  NotificationTrigger,
  NotificationResponse,
  PermissionStatus,
  NotificationPermissions,
  PushNotificationsContextValue,
  NotificationErrorCode,
} from './types';

export { NotificationError } from './types';

// Templates
export * from './notificationTemplates';

// Android channels
export {
  setupNotificationChannels,
  createNotificationChannel,
  deleteNotificationChannel,
  getNotificationChannels,
  getNotificationChannel,
  createNotificationChannelGroup,
  setupNotificationChannelGroups,
  getChannelForType,
  getNotificationWithChannel,
  NOTIFICATION_CHANNELS,
} from './android-channels';

export type { NotificationChannel } from './android-channels';

// Testing utilities (only import in development)
export * from './testing-utils';
