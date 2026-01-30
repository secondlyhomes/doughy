// src/features/deals/services/dealNotificationService.ts
// DEPRECATED: This file re-exports from deal-notifications/ for backward compatibility
// Import directly from '@/features/deals/services/deal-notifications' for new code

export {
  configureNotifications,
  requestNotificationPermissions,
  getPushToken,
  scheduleDailyDigest,
  scheduleOfferFollowup,
  scheduleContactReminder,
  scheduleActionDueReminder,
  sendMilestoneNotification,
  sendConversationNotification,
  cancelScheduledNotification,
  cancelDealNotifications,
  getScheduledNotifications,
  clearBadge,
  setBadgeCount,
  scheduleNotificationsForDeal,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  DEFAULT_PREFERENCES,
} from './deal-notifications';

export type {
  NotificationType,
  DealNotification,
  NotificationPreferences,
} from './deal-notifications';

export { default } from './deal-notifications';
