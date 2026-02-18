/**
 * Android Notification Channels
 *
 * Android 8.0+ requires notification channels for categorizing notifications.
 * Users can configure notification settings per channel.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ============================================================================
// Channel Definitions
// ============================================================================

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: Notifications.AndroidImportance;
  sound?: string;
  vibrationPattern?: number[];
  enableLights?: boolean;
  lightColor?: string;
  showBadge?: boolean;
}

/**
 * Default notification channels
 */
export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    id: 'default',
    name: 'General Notifications',
    description: 'General app notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableLights: true,
    lightColor: '#FF0000',
    showBadge: true,
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'New message notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'message.wav',
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    lightColor: '#0000FF',
    showBadge: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Task updates and reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableLights: true,
    lightColor: '#00FF00',
    showBadge: true,
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Likes, comments, and follows',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableLights: true,
    lightColor: '#FF00FF',
    showBadge: true,
  },
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'Important reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'alarm.wav',
    vibrationPattern: [0, 400, 200, 400],
    enableLights: true,
    lightColor: '#FFFF00',
    showBadge: true,
  },
  {
    id: 'system',
    name: 'System',
    description: 'System updates and maintenance',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
    enableLights: false,
    showBadge: false,
  },
  {
    id: 'promotions',
    name: 'Promotions',
    description: 'Special offers and deals',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
    enableLights: false,
    showBadge: false,
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Order updates and shipping notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableLights: true,
    lightColor: '#FFA500',
    showBadge: true,
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Payment confirmations and alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 500],
    enableLights: true,
    lightColor: '#00FF00',
    showBadge: true,
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Event reminders and updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'alarm.wav',
    enableLights: true,
    lightColor: '#FF0000',
    showBadge: true,
  },
];

// ============================================================================
// Setup Functions
// ============================================================================

/**
 * Initialize all notification channels (Android only)
 * Call this on app startup
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    for (const channel of NOTIFICATION_CHANNELS) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        vibrationPattern: channel.vibrationPattern,
        enableLights: channel.enableLights,
        lightColor: channel.lightColor,
        showBadge: channel.showBadge,
      });
    }

    console.log('Notification channels initialized');
  } catch (error) {
    console.error('Failed to setup notification channels:', error);
  }
}

/**
 * Create a custom notification channel
 */
export async function createNotificationChannel(
  channel: NotificationChannel
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      description: channel.description,
      importance: channel.importance,
      sound: channel.sound,
      vibrationPattern: channel.vibrationPattern,
      enableLights: channel.enableLights,
      lightColor: channel.lightColor,
      showBadge: channel.showBadge,
    });
  } catch (error) {
    console.error('Failed to create notification channel:', error);
  }
}

/**
 * Delete a notification channel
 */
export async function deleteNotificationChannel(
  channelId: string
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.deleteNotificationChannelAsync(channelId);
  } catch (error) {
    console.error('Failed to delete notification channel:', error);
  }
}

/**
 * Get all notification channels
 */
export async function getNotificationChannels(): Promise<
  Notifications.NotificationChannel[]
> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    return await Notifications.getNotificationChannelsAsync();
  } catch (error) {
    console.error('Failed to get notification channels:', error);
    return [];
  }
}

/**
 * Get a specific notification channel
 */
export async function getNotificationChannel(
  channelId: string
): Promise<Notifications.NotificationChannel | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return await Notifications.getNotificationChannelAsync(channelId);
  } catch (error) {
    console.error('Failed to get notification channel:', error);
    return null;
  }
}

// ============================================================================
// Channel Groups (Optional)
// ============================================================================

/**
 * Create notification channel group
 * Groups allow organizing related channels together in settings
 */
export async function createNotificationChannelGroup(
  groupId: string,
  groupName: string,
  description?: string
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelGroupAsync(groupId, {
      name: groupName,
      description,
    });
  } catch (error) {
    console.error('Failed to create notification channel group:', error);
  }
}

/**
 * Example: Setup channel groups
 */
export async function setupNotificationChannelGroups(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await createNotificationChannelGroup(
    'communication',
    'Communication',
    'Messages and social interactions'
  );

  await createNotificationChannelGroup(
    'productivity',
    'Productivity',
    'Tasks and reminders'
  );

  await createNotificationChannelGroup(
    'commerce',
    'Commerce',
    'Orders and payments'
  );

  await createNotificationChannelGroup(
    'updates',
    'Updates',
    'System updates and promotions'
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get channel ID for notification type
 */
export function getChannelForType(type: string): string {
  const channelMap: Record<string, string> = {
    message: 'messages',
    task: 'tasks',
    'task-assigned': 'tasks',
    'task-due': 'tasks',
    reminder: 'reminders',
    social: 'social',
    'new-follower': 'social',
    comment: 'social',
    like: 'social',
    order: 'orders',
    'order-confirmed': 'orders',
    'order-shipped': 'orders',
    'order-delivered': 'orders',
    payment: 'payments',
    'payment-success': 'payments',
    'payment-failed': 'payments',
    event: 'events',
    'event-reminder': 'events',
    system: 'system',
    'system-update': 'system',
    promotion: 'promotions',
    'price-drop': 'promotions',
  };

  return channelMap[type] || 'default';
}

/**
 * Example: Send notification with correct channel
 */
export function getNotificationWithChannel(
  title: string,
  body: string,
  type: string
): Notifications.NotificationContentInput {
  const channelId = getChannelForType(type);

  return {
    title,
    body,
    data: { type },
    ...(Platform.OS === 'android' && { channelId }),
  };
}
