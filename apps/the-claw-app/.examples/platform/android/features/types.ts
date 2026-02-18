/**
 * types.ts
 *
 * Type definitions for Android Notification Channels
 */

/**
 * Notification importance levels
 */
export enum ImportanceLevel {
  NONE = 0, // No sound or visual interruption
  MIN = 1, // No sound, appears in status bar
  LOW = 2, // No sound, appears in shade
  DEFAULT = 3, // Sound, appears in shade
  HIGH = 4, // Sound, appears as heads-up
  MAX = 5, // Sound, vibration, heads-up (deprecated in API 31)
}

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance: ImportanceLevel;
  showBadge?: boolean;
  enableLights?: boolean;
  lightColor?: string;
  enableVibration?: boolean;
  vibrationPattern?: number[];
  sound?: string;
  groupId?: string;
}

/**
 * Channel group configuration
 */
export interface NotificationChannelGroup {
  id: string;
  name: string;
  description?: string;
}

/**
 * Use case types for recommended importance
 */
export type NotificationUseCase = 'message' | 'reminder' | 'update' | 'background';
