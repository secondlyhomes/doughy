/**
 * channels.ts
 *
 * Default notification channel and group definitions
 */

import {
  ImportanceLevel,
  NotificationChannel,
  NotificationChannelGroup,
} from './types';

/**
 * Default notification channels
 */
export const DEFAULT_CHANNELS = {
  /** General notifications */
  general: {
    id: 'general',
    name: 'General',
    description: 'General app notifications',
    importance: ImportanceLevel.DEFAULT,
    showBadge: true,
    enableLights: true,
    lightColor: '#6750A4',
  } as NotificationChannel,

  /** Important notifications */
  important: {
    id: 'important',
    name: 'Important',
    description: 'Important notifications that require attention',
    importance: ImportanceLevel.HIGH,
    showBadge: true,
    enableLights: true,
    lightColor: '#B3261E',
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250],
  } as NotificationChannel,

  /** Reminders */
  reminders: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Task and event reminders',
    importance: ImportanceLevel.HIGH,
    showBadge: true,
    enableVibration: true,
  } as NotificationChannel,

  /** Messages */
  messages: {
    id: 'messages',
    name: 'Messages',
    description: 'Chat and message notifications',
    importance: ImportanceLevel.HIGH,
    showBadge: true,
    enableLights: true,
    enableVibration: true,
  } as NotificationChannel,

  /** Background updates */
  updates: {
    id: 'updates',
    name: 'Updates',
    description: 'Background sync and updates',
    importance: ImportanceLevel.LOW,
    showBadge: false,
  } as NotificationChannel,

  /** Silent notifications */
  silent: {
    id: 'silent',
    name: 'Silent',
    description: 'Silent notifications for background operations',
    importance: ImportanceLevel.MIN,
    showBadge: false,
  } as NotificationChannel,
};

/**
 * Channel groups
 */
export const CHANNEL_GROUPS = {
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'Task-related notifications',
  } as NotificationChannelGroup,

  communication: {
    id: 'communication',
    name: 'Communication',
    description: 'Messages and calls',
  } as NotificationChannelGroup,

  system: {
    id: 'system',
    name: 'System',
    description: 'System notifications',
  } as NotificationChannelGroup,
};

/**
 * Task-specific channel definitions
 */
export const TASK_CHANNELS: NotificationChannel[] = [
  {
    id: 'task_due_soon',
    name: 'Due Soon',
    description: 'Tasks due within 24 hours',
    importance: ImportanceLevel.HIGH,
    groupId: 'task_channels',
    showBadge: true,
    enableVibration: true,
  },
  {
    id: 'task_overdue',
    name: 'Overdue',
    description: 'Overdue tasks',
    importance: ImportanceLevel.HIGH,
    groupId: 'task_channels',
    showBadge: true,
    enableLights: true,
    lightColor: '#EF4444',
    enableVibration: true,
    vibrationPattern: [0, 500, 200, 500],
  },
  {
    id: 'task_completed',
    name: 'Completed',
    description: 'Task completion notifications',
    importance: ImportanceLevel.LOW,
    groupId: 'task_channels',
    showBadge: true,
  },
  {
    id: 'task_assigned',
    name: 'Assigned',
    description: 'New task assignments',
    importance: ImportanceLevel.DEFAULT,
    groupId: 'task_channels',
    showBadge: true,
    enableLights: true,
  },
];

/**
 * Task channel group
 */
export const TASK_CHANNEL_GROUP: NotificationChannelGroup = {
  id: 'task_channels',
  name: 'Tasks',
  description: 'Task notifications and reminders',
};
