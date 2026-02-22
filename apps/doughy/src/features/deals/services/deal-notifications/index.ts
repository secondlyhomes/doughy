// src/features/deals/services/deal-notifications/index.ts
// Deal Notification Service - manages push notifications for deal actions

export type { NotificationType, DealNotification, NotificationPreferences } from './types';
export { DEFAULT_PREFERENCES } from './types';

export {
  configureNotifications,
  requestNotificationPermissions,
  getPushToken,
} from './configuration';

export {
  scheduleDailyDigest,
  scheduleOfferFollowup,
  scheduleContactReminder,
  scheduleActionDueReminder,
} from './scheduling';

export {
  sendMilestoneNotification,
  sendConversationNotification,
} from './immediate';

export {
  cancelScheduledNotification,
  cancelDealNotifications,
  getScheduledNotifications,
  clearBadge,
  setBadgeCount,
  scheduleNotificationsForDeal,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './management';

// Default export for backward compatibility
import {
  configureNotifications,
  requestNotificationPermissions,
  getPushToken,
} from './configuration';

import {
  scheduleDailyDigest,
  scheduleOfferFollowup,
  scheduleContactReminder,
  scheduleActionDueReminder,
} from './scheduling';

import {
  sendMilestoneNotification,
  sendConversationNotification,
} from './immediate';

import {
  cancelScheduledNotification,
  cancelDealNotifications,
  getScheduledNotifications,
  clearBadge,
  setBadgeCount,
  scheduleNotificationsForDeal,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './management';

export default {
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
  scheduleNotificationsForDeal,
  clearBadge,
  setBadgeCount,
  addNotificationReceivedListener,
  addNotificationResponseListener,
};
