/**
 * Android Notification Channels
 *
 * Features:
 * - Channel management
 * - Channel groups
 * - Importance levels
 * - Custom notification behavior
 *
 * Requirements:
 * - Android 8.0+ (API 26+)
 */

// Types
export {
  ImportanceLevel,
  NotificationChannel,
  NotificationChannelGroup,
  NotificationUseCase,
} from './types';

// Channel definitions
export {
  DEFAULT_CHANNELS,
  CHANNEL_GROUPS,
  TASK_CHANNELS,
  TASK_CHANNEL_GROUP,
} from './channels';

// Manager and initialization
export {
  NotificationChannelManager,
  initializeNotificationChannels,
  setupTaskChannels,
} from './NotificationChannelManager';

// Utilities
export { ChannelImportance, ChannelMigration } from './utils';

// Components
export { ChannelSettingsButton } from './ChannelSettingsButton';
