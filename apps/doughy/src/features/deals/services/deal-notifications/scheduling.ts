// src/features/deals/services/deal-notifications/scheduling.ts
// Notification scheduling functions

import * as Notifications from 'expo-notifications';

import type { Deal } from '../../types';
import type { NextAction } from '../../hooks/useNextAction';
import type { NotificationPreferences } from './types';
import { cancelScheduledNotification } from './management';

/**
 * Schedule daily digest notification
 */
export async function scheduleDailyDigest(
  preferences: NotificationPreferences
): Promise<string | null> {
  if (!preferences.enabled || !preferences.dailyDigestTime) return null;

  try {
    // Cancel existing daily digest
    await cancelScheduledNotification('daily-digest');

    const [hours, minutes] = preferences.dailyDigestTime.split(':').map(Number);

    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Deal Digest',
        body: 'Check your deals that need attention today',
        data: { type: 'daily_digest' },
        categoryIdentifier: 'daily-digest',
      },
      trigger,
      identifier: 'daily-digest',
    });

    console.log('[Notifications] Scheduled daily digest for', preferences.dailyDigestTime);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling daily digest:', error);
    return null;
  }
}

/**
 * Schedule offer follow-up reminder
 */
export async function scheduleOfferFollowup(
  deal: Deal,
  daysFromNow: number = 2
): Promise<string | null> {
  try {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    scheduledDate.setHours(10, 0, 0, 0); // 10 AM

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Offer Follow-up Due',
        body: `Follow up on your offer for ${deal.property?.address || 'deal'}`,
        data: {
          type: 'offer_followup',
          dealId: deal.id,
        },
        categoryIdentifier: 'deal-actions',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
      identifier: `offer-followup-${deal.id}`,
    });

    console.log('[Notifications] Scheduled offer follow-up for', scheduledDate);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling offer follow-up:', error);
    return null;
  }
}

/**
 * Schedule contact reminder
 */
export async function scheduleContactReminder(
  deal: Deal,
  message: string,
  date: Date
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Contact Reminder',
        body: message,
        data: {
          type: 'contact_reminder',
          dealId: deal.id,
        },
        categoryIdentifier: 'deal-actions',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
      identifier: `contact-reminder-${deal.id}-${date.getTime()}`,
    });

    console.log('[Notifications] Scheduled contact reminder for', date);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling contact reminder:', error);
    return null;
  }
}

/**
 * Schedule action due reminder
 */
export async function scheduleActionDueReminder(
  deal: Deal,
  action: NextAction
): Promise<string | null> {
  if (!action.dueDate) return null;

  try {
    const dueDate = new Date(action.dueDate);
    // Remind at 9 AM on the due date
    dueDate.setHours(9, 0, 0, 0);

    // Don't schedule if already past
    if (dueDate < new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Action Due Today',
        body: action.action,
        data: {
          type: 'action_due',
          dealId: deal.id,
          action: action.action,
        },
        categoryIdentifier: 'deal-actions',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
      },
      identifier: `action-due-${deal.id}`,
    });

    console.log('[Notifications] Scheduled action reminder for', dueDate);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling action reminder:', error);
    return null;
  }
}
