/**
 * NotificationChannelManager.ts
 *
 * Core manager for Android Notification Channels (Android 8.0+)
 */

import { NativeModules, Platform } from 'react-native';
import { NotificationChannel, NotificationChannelGroup } from './types';
import { DEFAULT_CHANNELS, CHANNEL_GROUPS, TASK_CHANNELS, TASK_CHANNEL_GROUP } from './channels';

const { NotificationChannelModule } = NativeModules;

/**
 * Notification Channel Manager
 */
export class NotificationChannelManager {
  /**
   * Check if notification channels are supported
   */
  static isSupported(): boolean {
    return Platform.OS === 'android' && Platform.Version >= 26;
  }

  /**
   * Create notification channel
   */
  static async createChannel(channel: NotificationChannel): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notification channels not supported on this platform');
      return;
    }

    try {
      await NotificationChannelModule.createChannel(channel);
    } catch (error) {
      console.error('Failed to create notification channel:', error);
      throw error;
    }
  }

  /**
   * Create multiple channels
   */
  static async createChannels(channels: NotificationChannel[]): Promise<void> {
    if (!this.isSupported()) return;

    for (const channel of channels) {
      await this.createChannel(channel);
    }
  }

  /**
   * Update channel (limited properties can be updated)
   */
  static async updateChannel(channel: NotificationChannel): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await NotificationChannelModule.updateChannel(channel);
    } catch (error) {
      console.error('Failed to update notification channel:', error);
      throw error;
    }
  }

  /**
   * Delete channel
   */
  static async deleteChannel(channelId: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await NotificationChannelModule.deleteChannel(channelId);
    } catch (error) {
      console.error('Failed to delete notification channel:', error);
      throw error;
    }
  }

  /**
   * Create channel group
   */
  static async createChannelGroup(group: NotificationChannelGroup): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await NotificationChannelModule.createChannelGroup(group);
    } catch (error) {
      console.error('Failed to create channel group:', error);
      throw error;
    }
  }

  /**
   * Delete channel group (also deletes all channels in group)
   */
  static async deleteChannelGroup(groupId: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await NotificationChannelModule.deleteChannelGroup(groupId);
    } catch (error) {
      console.error('Failed to delete channel group:', error);
      throw error;
    }
  }

  /**
   * Open channel settings
   */
  static async openChannelSettings(channelId: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await NotificationChannelModule.openChannelSettings(channelId);
    } catch (error) {
      console.error('Failed to open channel settings:', error);
      throw error;
    }
  }

  /**
   * Get all channels
   */
  static async getChannels(): Promise<NotificationChannel[]> {
    if (!this.isSupported()) return [];

    try {
      return await NotificationChannelModule.getChannels();
    } catch (error) {
      console.error('Failed to get channels:', error);
      return [];
    }
  }
}

/**
 * Initialize default channels
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (!NotificationChannelManager.isSupported()) {
    return;
  }

  // Create channel groups
  await NotificationChannelManager.createChannelGroup(CHANNEL_GROUPS.tasks);
  await NotificationChannelManager.createChannelGroup(CHANNEL_GROUPS.communication);
  await NotificationChannelManager.createChannelGroup(CHANNEL_GROUPS.system);

  // Create channels
  await NotificationChannelManager.createChannels([
    { ...DEFAULT_CHANNELS.general, groupId: CHANNEL_GROUPS.system.id },
    { ...DEFAULT_CHANNELS.important, groupId: CHANNEL_GROUPS.tasks.id },
    { ...DEFAULT_CHANNELS.reminders, groupId: CHANNEL_GROUPS.tasks.id },
    { ...DEFAULT_CHANNELS.messages, groupId: CHANNEL_GROUPS.communication.id },
    { ...DEFAULT_CHANNELS.updates, groupId: CHANNEL_GROUPS.system.id },
    { ...DEFAULT_CHANNELS.silent, groupId: CHANNEL_GROUPS.system.id },
  ]);
}

/**
 * Setup task-specific channels
 */
export async function setupTaskChannels(): Promise<void> {
  await NotificationChannelManager.createChannelGroup(TASK_CHANNEL_GROUP);
  await NotificationChannelManager.createChannels(TASK_CHANNELS);
}
