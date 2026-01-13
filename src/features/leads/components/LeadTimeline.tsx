// Lead Timeline Component - React Native
// Zone D: Activity timeline for lead detail screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  RefreshCw,
  Home,
  User,
  Clock,
  Plus,
} from 'lucide-react-native';

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

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'call':
      return <Phone size={16} color="#3b82f6" />;
    case 'email':
      return <Mail size={16} color="#22c55e" />;
    case 'text':
      return <MessageSquare size={16} color="#8b5cf6" />;
    case 'meeting':
      return <Calendar size={16} color="#f59e0b" />;
    case 'note':
      return <FileText size={16} color="#6b7280" />;
    case 'status_change':
      return <RefreshCw size={16} color="#ef4444" />;
    case 'property_shown':
      return <Home size={16} color="#06b6d4" />;
    default:
      return <Clock size={16} color="#6b7280" />;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case 'call':
      return 'bg-blue-100';
    case 'email':
      return 'bg-green-100';
    case 'text':
      return 'bg-purple-100';
    case 'meeting':
      return 'bg-amber-100';
    case 'note':
      return 'bg-gray-100';
    case 'status_change':
      return 'bg-red-100';
    case 'property_shown':
      return 'bg-cyan-100';
    default:
      return 'bg-gray-100';
  }
}

function formatActivityType(type: ActivityType): string {
  switch (type) {
    case 'call':
      return 'Phone Call';
    case 'email':
      return 'Email';
    case 'text':
      return 'Text Message';
    case 'meeting':
      return 'Meeting';
    case 'note':
      return 'Note Added';
    case 'status_change':
      return 'Status Changed';
    case 'property_shown':
      return 'Property Shown';
    default:
      return 'Activity';
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

interface TimelineItemProps {
  activity: LeadActivity;
  isLast: boolean;
}

function TimelineItem({ activity, isLast }: TimelineItemProps) {
  return (
    <View className="flex-row">
      {/* Timeline connector */}
      <View className="items-center mr-3">
        <View className={`w-8 h-8 rounded-full ${getActivityColor(activity.type)} items-center justify-center`}>
          {getActivityIcon(activity.type)}
        </View>
        {!isLast && (
          <View className="w-0.5 flex-1 bg-border my-1" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-medium text-foreground">
            {formatActivityType(activity.type)}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {formatTimeAgo(activity.created_at)}
          </Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          {activity.description}
        </Text>
        {activity.metadata && 'duration' in activity.metadata && Boolean(activity.metadata.duration) ? (
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="#9ca3af" />
            <Text className="text-xs text-muted-foreground ml-1">
              Duration: {String(activity.metadata.duration)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Mock activities for development
const mockActivities: LeadActivity[] = [
  {
    id: '1',
    lead_id: '1',
    type: 'call',
    description: 'Discussed property requirements and budget. Very interested in downtown properties.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { duration: '15 min', outcome: 'positive' },
  },
  {
    id: '2',
    lead_id: '1',
    type: 'email',
    description: 'Sent property listings matching their criteria.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    lead_id: '1',
    type: 'status_change',
    description: 'Status changed from New to Active.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    lead_id: '1',
    type: 'property_shown',
    description: 'Showed 123 Oak Street property. Client liked the layout but wanted more backyard space.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    lead_id: '1',
    type: 'note',
    description: 'Lead was referred by John Smith. High priority - looking to move within 3 months.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function LeadTimeline({ activities, onAddActivity }: LeadTimelineProps) {
  return (
    <View>
      {/* Header with Add Button */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Calendar size={18} color="#6b7280" />
          <Text className="text-lg font-semibold text-foreground ml-2">Activity</Text>
        </View>
        {onAddActivity && (
          <TouchableOpacity
            className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-lg"
            onPress={onAddActivity}
          >
            <Plus size={14} color="#3b82f6" />
            <Text className="text-primary text-sm ml-1">Log Activity</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timeline */}
      {activities.length > 0 ? (
        <View>
          {activities.map((activity, index) => (
            <TimelineItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </View>
      ) : (
        <View className="py-8 items-center">
          <Clock size={32} color="#d1d5db" />
          <Text className="text-muted-foreground text-center mt-2">
            No activity recorded yet
          </Text>
          {onAddActivity && (
            <TouchableOpacity
              className="mt-3 bg-primary px-4 py-2 rounded-lg"
              onPress={onAddActivity}
            >
              <Text className="text-primary-foreground font-medium">Log First Activity</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default LeadTimeline;
