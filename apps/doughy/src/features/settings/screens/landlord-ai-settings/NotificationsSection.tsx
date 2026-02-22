// src/features/settings/screens/landlord-ai-settings/NotificationsSection.tsx
// Notification settings section

import React from 'react';
import { View } from 'react-native';
import { Bell, Bot, MessageSquare, Clock, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SettingSection } from './SettingSection';
import { ToggleSectionRow } from './ToggleSectionRow';

interface NotificationsSectionProps {
  newLeads: boolean;
  aiNeedsReview: boolean;
  bookingRequests: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  alwaysNotifyOnLeadResponse: boolean;
  onToggleNewLeads: () => void;
  onToggleAINeedsReview: () => void;
  onToggleBookingRequests: () => void;
  onToggleQuietHours: () => void;
  onToggleLeadNotify: (value: boolean) => void;
}

export function NotificationsSection({
  newLeads,
  aiNeedsReview,
  bookingRequests,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  alwaysNotifyOnLeadResponse,
  onToggleNewLeads,
  onToggleAINeedsReview,
  onToggleBookingRequests,
  onToggleQuietHours,
  onToggleLeadNotify,
}: NotificationsSectionProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="NOTIFICATIONS">
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        <ToggleSectionRow
          icon={<Bell size={20} color={colors.mutedForeground} />}
          title="New Leads"
          description="Get notified when new leads arrive"
          value={newLeads}
          onValueChange={onToggleNewLeads}
        />
        <ToggleSectionRow
          icon={<Bot size={20} color={colors.mutedForeground} />}
          title="AI Needs Review"
          description="Get notified when AI queues a response for review"
          value={aiNeedsReview}
          onValueChange={onToggleAINeedsReview}
        />
        <ToggleSectionRow
          icon={<MessageSquare size={20} color={colors.mutedForeground} />}
          title="Booking Requests"
          description="Get notified for new booking inquiries"
          value={bookingRequests}
          onValueChange={onToggleBookingRequests}
        />
        <ToggleSectionRow
          icon={<Clock size={20} color={colors.mutedForeground} />}
          title="Quiet Hours"
          description={`${quietHoursStart} - ${quietHoursEnd}`}
          value={quietHoursEnabled}
          onValueChange={onToggleQuietHours}
        />
        <ToggleSectionRow
          icon={<User size={20} color={colors.mutedForeground} />}
          title="Notify on Lead Responses"
          description="Even when AI auto-sends to leads"
          value={alwaysNotifyOnLeadResponse}
          onValueChange={onToggleLeadNotify}
          isLast
        />
      </View>
    </SettingSection>
  );
}
