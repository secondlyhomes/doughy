// src/features/deals/services/deal-notifications/management.ts
// Notification management and smart scheduling

import * as Notifications from 'expo-notifications';

import type { Deal } from '../../types';
import { calculateNextAction } from '../../hooks/useNextAction';
import type { NotificationPreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';
import {
  scheduleDailyDigest,
  scheduleOfferFollowup,
  scheduleContactReminder,
  scheduleActionDueReminder,
} from './scheduling';

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('[Notifications] Cancelled notification:', identifier);
  } catch (error) {
    console.error('[Notifications] Error cancelling notification:', error);
  }
}

/**
 * Cancel all notifications for a deal
 */
export async function cancelDealNotifications(dealId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dealNotifications = scheduled.filter(
      (n) => (n.content.data as Record<string, unknown>)?.dealId === dealId
    );

    for (const notification of dealNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`[Notifications] Cancelled ${dealNotifications.length} notifications for deal ${dealId}`);
  } catch (error) {
    console.error('[Notifications] Error cancelling deal notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Clear badge count
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Schedule all appropriate notifications for a deal based on its state
 */
export async function scheduleNotificationsForDeal(
  deal: Deal,
  preferences: NotificationPreferences = DEFAULT_PREFERENCES
): Promise<void> {
  if (!preferences.enabled) return;

  // Cancel existing notifications for this deal
  await cancelDealNotifications(deal.id);

  // Get next action
  const nextAction = calculateNextAction(deal);

  // Schedule action due reminder
  if (preferences.actionDueReminders && nextAction.dueDate) {
    await scheduleActionDueReminder(deal, nextAction);
  }

  // Schedule offer follow-up
  if (preferences.offerFollowups && deal.stage === 'offer_sent') {
    const sentOffer = deal.offers?.find((o) => o.status === 'sent');
    if (sentOffer) {
      const daysSinceSent = sentOffer.created_at
        ? Math.floor((Date.now() - new Date(sentOffer.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Schedule follow-up if not already past due
      if (daysSinceSent < 2) {
        await scheduleOfferFollowup(deal, 2 - daysSinceSent);
      }
    }
  }

  // Schedule contact reminder for stale deals
  if (preferences.contactReminders) {
    const lastContact = deal.lead?.last_contacted_at || deal.last_activity_at;
    if (lastContact) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
      );

      // If getting close to stale, schedule reminder
      if (daysSinceContact >= 3 && daysSinceContact < 7) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + (7 - daysSinceContact));
        reminderDate.setHours(10, 0, 0, 0);

        await scheduleContactReminder(
          deal,
          `Don't forget to follow up with ${deal.lead?.name || 'your seller'}`,
          reminderDate
        );
      }
    }
  }
}

/**
 * Add listener for notification received (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification response (user tapped)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
