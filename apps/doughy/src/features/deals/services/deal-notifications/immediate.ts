// src/features/deals/services/deal-notifications/immediate.ts
// Immediate notification functions (send now, not scheduled)

import * as Notifications from 'expo-notifications';

import type { Deal } from '../../types';

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
