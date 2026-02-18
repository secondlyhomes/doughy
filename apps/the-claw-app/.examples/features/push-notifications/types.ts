/**
 * Push Notifications Types
 *
 * Complete type definitions for push notification system including:
 * - Notification payloads and data
 * - Push tokens and registration
 * - Notification categories and actions
 * - Deep linking and routing
 */

import { ExpoPushToken } from 'expo-notifications';

// ============================================================================
// Core Notification Types
// ============================================================================

/**
 * Priority levels for notifications
 */
export type NotificationPriority = 'default' | 'normal' | 'high';

/**
 * Notification categories for iOS action buttons
 */
export type NotificationCategory =
  | 'message'
  | 'task'
  | 'reminder'
  | 'social'
  | 'system';

/**
 * Notification action identifiers
 */
export type NotificationAction =
  | 'reply'
  | 'view'
  | 'complete'
  | 'dismiss'
  | 'like'
  | 'accept'
  | 'decline';

/**
 * Deep link routes for notification taps
 */
export interface NotificationDeepLink {
  screen: string;
  params?: Record<string, any>;
}

/**
 * Custom data payload attached to notifications
 */
export interface NotificationData {
  type: string;
  id?: string;
  deepLink?: NotificationDeepLink;
  [key: string]: any;
}

/**
 * Rich notification content (images, attachments)
 */
export interface NotificationAttachment {
  url: string;
  type?: 'image' | 'video' | 'audio';
  thumbnail?: string;
}

/**
 * Complete notification payload
 */
export interface NotificationPayload {
  title: string;
  body: string;
  subtitle?: string;
  data?: NotificationData;
  badge?: number;
  sound?: string | boolean;
  priority?: NotificationPriority;
  categoryId?: NotificationCategory;
  attachments?: NotificationAttachment[];
  channelId?: string; // Android only
}

// ============================================================================
// Push Token Types
// ============================================================================

/**
 * Push token registration status
 */
export type TokenStatus = 'active' | 'inactive' | 'expired';

/**
 * Device platform
 */
export type DevicePlatform = 'ios' | 'android';

/**
 * Push token database record
 */
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_platform: DevicePlatform;
  device_name?: string;
  app_version?: string;
  status: TokenStatus;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

/**
 * Token registration request
 */
export interface RegisterTokenRequest {
  token: string;
  devicePlatform: DevicePlatform;
  deviceName?: string;
  appVersion?: string;
}

// ============================================================================
// Notification History Types
// ============================================================================

/**
 * Notification delivery status
 */
export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'read';

/**
 * Notification log record
 */
export interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data?: NotificationData;
  status: NotificationStatus;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
}

// ============================================================================
// Expo Push API Types
// ============================================================================

/**
 * Expo push message format
 */
export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  subtitle?: string;
  body?: string;
  data?: NotificationData;
  sound?: string | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
  expiration?: number;
  mutableContent?: boolean;
}

/**
 * Expo push ticket (send response)
 */
export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

/**
 * Expo push receipt (delivery status)
 */
export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'MessageTooBig' | 'MessageRateExceeded' | 'InvalidCredentials';
  };
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Send notification request
 */
export interface SendNotificationRequest {
  userId: string;
  notification: NotificationPayload;
  scheduledFor?: Date;
}

/**
 * Batch send request
 */
export interface BatchNotificationRequest {
  userIds: string[];
  notification: NotificationPayload;
  scheduledFor?: Date;
}

/**
 * Schedule notification request
 */
export interface ScheduleNotificationRequest {
  notification: NotificationPayload;
  trigger: NotificationTrigger;
  identifier?: string;
}

/**
 * Notification trigger types
 */
export type NotificationTrigger =
  | { type: 'time'; date: Date }
  | { type: 'timeInterval'; seconds: number; repeats?: boolean }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; weekday: number; hour: number; minute: number }
  | { type: 'calendar'; year?: number; month?: number; day?: number; hour?: number; minute?: number; repeats?: boolean };

/**
 * Notification response (when user taps)
 */
export interface NotificationResponse {
  notification: {
    request: {
      content: {
        title: string;
        body: string;
        data: NotificationData;
      };
      identifier: string;
      trigger: any;
    };
    date: number;
  };
  actionIdentifier: string;
  userText?: string;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Notification permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Permission settings
 */
export interface NotificationPermissions {
  status: PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
  ios?: {
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
    allowsCriticalAlerts: boolean;
    allowsDisplayInCarPlay: boolean;
    allowsDisplayInNotificationCenter: boolean;
    allowsDisplayOnLockScreen: boolean;
  };
  android?: {
    importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
    interruptionFilter: 'unknown' | 'all' | 'priority' | 'none' | 'alarms';
  };
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Push notifications context state
 */
export interface PushNotificationsContextValue {
  // State
  expoPushToken: string | null;
  permissionStatus: PermissionStatus;
  isRegistered: boolean;

  // Actions
  requestPermissions: () => Promise<PermissionStatus>;
  registerPushToken: () => Promise<void>;
  unregisterPushToken: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
  scheduleNotification: (request: ScheduleNotificationRequest) => Promise<string>;
  cancelScheduledNotification: (identifier: string) => Promise<void>;
  cancelAllScheduledNotifications: () => Promise<void>;

  // Handlers (set by app)
  onNotificationReceived?: (notification: NotificationPayload) => void;
  onNotificationTapped?: (response: NotificationResponse) => void;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Notification error codes
 */
export enum NotificationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TOKEN_REGISTRATION_FAILED = 'TOKEN_REGISTRATION_FAILED',
  SEND_FAILED = 'SEND_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  DEVICE_NOT_REGISTERED = 'DEVICE_NOT_REGISTERED',
  SCHEDULING_FAILED = 'SCHEDULING_FAILED',
}

/**
 * Notification error
 */
export class NotificationError extends Error {
  constructor(
    public code: NotificationErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}
