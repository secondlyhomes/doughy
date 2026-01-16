// src/features/deals/services/dealNotificationService.ts
// Deal Notification Service - Zone G Week 9
// Manages push notifications for deal actions, reminders, and digests

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Deal, DealStage } from '../types';
import { calculateNextAction, NextAction } from '../hooks/useNextAction';

// ============================================
// Types
// ============================================

export type NotificationType =
  | 'daily_digest'
  | 'offer_followup'
  | 'contact_reminder'
  | 'milestone_reached'
  | 'action_due'
  | 'conversation_received';

export interface DealNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  dealId?: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
  sent: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  dailyDigestTime: string; // 24h format "09:00"
  offerFollowups: boolean;
  contactReminders: boolean;
  milestoneAlerts: boolean;
  actionDueReminders: boolean;
  conversationAlerts: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyDigestTime: '09:00',
  offerFollowups: true,
  contactReminders: true,
  milestoneAlerts: true,
  actionDueReminders: true,
  conversationAlerts: true,
};

// ============================================
// Notification Configuration
// ============================================

/**
 * Configure notification handler
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('deal-actions', {
      name: 'Deal Actions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    await Notifications.setNotificationChannelAsync('daily-digest', {
      name: 'Daily Digest',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

/**
 * Get the push token for this device
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

// ============================================
// Notification Scheduling
// ============================================

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

// ============================================
// Immediate Notifications
// ============================================

/**
 * Send milestone notification
 */
export async function sendMilestoneNotification(
  deal: Deal,
  milestone: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Deal Milestone Reached!',
        body: `${deal.property?.address || 'Your deal'}: ${milestone}`,
        data: {
          type: 'milestone_reached',
          dealId: deal.id,
          milestone,
        },
        categoryIdentifier: 'deal-actions',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('[Notifications] Error sending milestone notification:', error);
  }
}

/**
 * Send conversation received notification
 */
export async function sendConversationNotification(
  deal: Deal,
  conversationType: 'sms' | 'call' | 'email',
  preview: string
): Promise<void> {
  try {
    const typeLabels = {
      sms: 'New SMS',
      call: 'Missed Call',
      email: 'New Email',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: typeLabels[conversationType],
        body: `${deal.lead?.name || 'Lead'}: ${preview.slice(0, 100)}`,
        data: {
          type: 'conversation_received',
          dealId: deal.id,
          conversationType,
        },
        categoryIdentifier: 'deal-actions',
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('[Notifications] Error sending conversation notification:', error);
  }
}

// ============================================
// Notification Management
// ============================================

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

// ============================================
// Smart Notification Scheduling
// ============================================

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

// ============================================
// Notification Listeners
// ============================================

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
