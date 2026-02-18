/**
 * utils.ts
 *
 * Utility functions for notification channels
 */

import { ImportanceLevel, NotificationChannel, NotificationUseCase } from './types';
import { NotificationChannelManager } from './NotificationChannelManager';

/**
 * Channel importance helper
 */
export const ChannelImportance = {
  /**
   * Get user-friendly description
   */
  getDescription(importance: ImportanceLevel): string {
    switch (importance) {
      case ImportanceLevel.NONE:
        return 'No notification';
      case ImportanceLevel.MIN:
        return 'Minimal (no sound)';
      case ImportanceLevel.LOW:
        return 'Low (no sound)';
      case ImportanceLevel.DEFAULT:
        return 'Default (sound)';
      case ImportanceLevel.HIGH:
        return 'Urgent (sound + popup)';
      case ImportanceLevel.MAX:
        return 'Critical (sound + vibrate + popup)';
      default:
        return 'Unknown';
    }
  },

  /**
   * Get recommended importance for use case
   */
  getRecommended(useCase: NotificationUseCase): ImportanceLevel {
    switch (useCase) {
      case 'message':
        return ImportanceLevel.HIGH;
      case 'reminder':
        return ImportanceLevel.HIGH;
      case 'update':
        return ImportanceLevel.DEFAULT;
      case 'background':
        return ImportanceLevel.LOW;
      default:
        return ImportanceLevel.DEFAULT;
    }
  },
};

/**
 * Channel migration helper
 */
export class ChannelMigration {
  /**
   * Migrate from old channel to new channel
   */
  static async migrate(oldChannelId: string, newChannel: NotificationChannel): Promise<void> {
    // Create new channel
    await NotificationChannelManager.createChannel(newChannel);

    // Delete old channel
    await NotificationChannelManager.deleteChannel(oldChannelId);

    // Note: Users will need to re-enable notifications for the new channel
  }

  /**
   * Rename channel (requires migration)
   */
  static async renameChannel(
    channelId: string,
    newName: string,
    newDescription?: string
  ): Promise<void> {
    const channels = await NotificationChannelManager.getChannels();
    const channel = channels.find((c) => c.id === channelId);

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Create new channel with updated name
    const newChannel: NotificationChannel = {
      ...channel,
      id: `${channelId}_v2`,
      name: newName,
      description: newDescription || channel.description,
    };

    await this.migrate(channelId, newChannel);
  }
}
