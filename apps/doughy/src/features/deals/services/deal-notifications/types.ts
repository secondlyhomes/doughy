// src/features/deals/services/deal-notifications/types.ts
// Types for deal notification service

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

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyDigestTime: '09:00',
  offerFollowups: true,
  contactReminders: true,
  milestoneAlerts: true,
  actionDueReminders: true,
  conversationAlerts: true,
};
