// Lead Timeline Component - React Native
// Zone D: Activity timeline for lead detail screen
// Now uses Timeline component for consistency

import React from 'react';
import { View, Text } from 'react-native';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  RefreshCw,
  Home,
  Clock,
} from 'lucide-react-native';
import { Timeline, TimelineEvent, TimelineEventConfig } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';

export type ActivityType =
  | 'call'
  | 'email'
  | 'text'
  | 'meeting'
  | 'note'
  | 'status_change'
  | 'property_shown';

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface LeadTimelineProps {
  activities: LeadActivity[];
  onAddActivity?: () => void;
}

// Activity type configuration
const ACTIVITY_TYPE_CONFIG: Record<ActivityType, TimelineEventConfig> = {
  call: { icon: Phone, colorKey: 'info', label: 'Phone Call' },
  email: { icon: Mail, colorKey: 'success', label: 'Email' },
  text: { icon: MessageSquare, colorKey: 'primary', label: 'Text Message' },
  meeting: { icon: Calendar, colorKey: 'warning', label: 'Meeting' },
  note: { icon: FileText, colorKey: 'mutedForeground', label: 'Note Added' },
  status_change: { icon: RefreshCw, colorKey: 'destructive', label: 'Status Changed' },
  property_shown: { icon: Home, colorKey: 'info', label: 'Property Shown' },
};

export function LeadTimeline({ activities, onAddActivity }: LeadTimelineProps) {
  const colors = useThemeColors();

  // Map LeadActivity to TimelineEvent
  const timelineEvents: TimelineEvent[] = activities.map(activity => ({
    id: activity.id,
    type: activity.type,
    title: ACTIVITY_TYPE_CONFIG[activity.type]?.label || 'Activity',
    description: activity.description,
    timestamp: activity.created_at,
    metadata: activity.metadata,
    source: 'user',
  }));

  // Render metadata for activities with duration
  const renderMetadata = (event: TimelineEvent) => {
    if (event.metadata && 'duration' in event.metadata && event.metadata.duration) {
      return (
        <View className="flex-row items-center mt-1">
          <Clock size={12} color={colors.mutedForeground} />
          <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
            Duration: {String(event.metadata.duration)}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Timeline
      events={timelineEvents}
      eventConfig={ACTIVITY_TYPE_CONFIG}
      onAddActivity={onAddActivity}
      showHeader={true}
      headerTitle="Activity"
      addButtonText="Log Activity"
      emptyStateMessage="No activity recorded yet"
      emptyCTAText="Log First Activity"
      renderEventMetadata={renderMetadata}
    />
  );
}

export default LeadTimeline;
