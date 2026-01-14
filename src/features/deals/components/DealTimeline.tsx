// src/features/deals/components/DealTimeline.tsx
// Zone B: Task B4 - Deal timeline component
// Displays chronological events for a deal, supports Focus Mode filtering

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  RefreshCw,
  Target,
  FileText,
  Send,
  MessageSquare,
  Camera,
  CheckCircle,
  Calculator,
  Share2,
  Upload,
  PenTool,
  Shield,
  Sparkles,
  Clock,
  Plus,
  Calendar,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useDealEvents } from '../hooks/useDealEvents';
import type { DealEvent, DealEventType } from '../types/events';
import { EVENT_TYPE_CONFIG } from '../types/events';

// ============================================
// Helper Functions
// ============================================

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);

  // Validate the date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates (shouldn't happen, but just in case)
  if (diffMs < 0) {
    return 'Just now';
  }

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

interface ThemeColors {
  primary: string;
  info: string;
  success: string;
  warning: string;
  destructive: string;
  mutedForeground: string;
  border: string;
  card: string;
  [key: string]: string;
}

function getEventIcon(eventType: DealEventType, colors: ThemeColors) {
  const config = EVENT_TYPE_CONFIG[eventType];
  const color = colors[config.colorKey] || colors.mutedForeground;
  const size = 16;

  switch (config.iconName) {
    case 'RefreshCw':
      return <RefreshCw size={size} color={color} />;
    case 'Target':
      return <Target size={size} color={color} />;
    case 'FileText':
      return <FileText size={size} color={color} />;
    case 'Send':
      return <Send size={size} color={color} />;
    case 'MessageSquare':
      return <MessageSquare size={size} color={color} />;
    case 'Camera':
      return <Camera size={size} color={color} />;
    case 'CheckCircle':
      return <CheckCircle size={size} color={color} />;
    case 'Calculator':
      return <Calculator size={size} color={color} />;
    case 'Share2':
      return <Share2 size={size} color={color} />;
    case 'Upload':
      return <Upload size={size} color={color} />;
    case 'PenTool':
      return <PenTool size={size} color={color} />;
    case 'Shield':
      return <Shield size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    default:
      return <Clock size={size} color={color} />;
  }
}

function getEventBgColor(eventType: DealEventType): string {
  const config = EVENT_TYPE_CONFIG[eventType];
  switch (config.colorKey) {
    case 'primary':
      return 'bg-primary/20';
    case 'info':
      return 'bg-info/20';
    case 'success':
      return 'bg-success/20';
    case 'warning':
      return 'bg-warning/20';
    case 'destructive':
      return 'bg-destructive/20';
    default:
      return 'bg-muted';
  }
}

function getSourceBadge(source: DealEvent['source'], colors: ThemeColors) {
  if (source === 'ai') {
    return (
      <View
        className="px-1.5 py-0.5 rounded ml-2"
        style={{ backgroundColor: `${colors.primary}20` }}
      >
        <Text className="text-[10px] font-medium" style={{ color: colors.primary }}>
          AI
        </Text>
      </View>
    );
  }
  return null;
}

// ============================================
// Timeline Item Component
// ============================================

interface TimelineItemProps {
  event: DealEvent;
  isLast: boolean;
  colors: ThemeColors;
}

function TimelineItem({ event, isLast, colors }: TimelineItemProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];

  return (
    <View className="flex-row">
      {/* Timeline connector */}
      <View className="items-center mr-3">
        <View
          className={`w-8 h-8 rounded-full ${getEventBgColor(event.event_type)} items-center justify-center`}
        >
          {getEventIcon(event.event_type, colors)}
        </View>
        {!isLast && <View className="w-0.5 flex-1 bg-border my-1" />}
      </View>

      {/* Content */}
      <View className="flex-1 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center flex-1">
            <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
              {event.title}
            </Text>
            {getSourceBadge(event.source, colors)}
          </View>
          <Text className="text-xs text-muted-foreground ml-2">
            {formatTimeAgo(event.created_at)}
          </Text>
        </View>
        {event.description && (
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {event.description}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================
// Main Component
// ============================================

interface DealTimelineProps {
  dealId: string;
  keyEventsOnly?: boolean;
  maxEvents?: number;
  onAddActivity?: () => void;
  showHeader?: boolean;
}

export function DealTimeline({
  dealId,
  keyEventsOnly = false,
  maxEvents,
  onAddActivity,
  showHeader = true,
}: DealTimelineProps) {
  const colors = useThemeColors() as ThemeColors;
  const { events, keyEvents, isLoading, error } = useDealEvents(dealId);

  // Choose which events to display
  const displayEvents = keyEventsOnly ? keyEvents : events;
  const limitedEvents = maxEvents ? displayEvents?.slice(0, maxEvents) : displayEvents;

  // Loading state
  if (isLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="py-4 items-center">
        <Text className="text-destructive text-sm">Failed to load timeline</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header with Add Button */}
      {showHeader && (
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Calendar size={18} color={colors.mutedForeground} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              Activity
            </Text>
            {keyEventsOnly && (
              <View
                className="ml-2 px-2 py-0.5 rounded"
                style={{ backgroundColor: colors.card }}
              >
                <Text className="text-xs text-muted-foreground">Focus Mode</Text>
              </View>
            )}
          </View>
          {onAddActivity && (
            <TouchableOpacity
              className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-lg"
              onPress={onAddActivity}
            >
              <Plus size={14} color={colors.primary} />
              <Text className="text-primary text-sm ml-1">Add Note</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Timeline */}
      {limitedEvents && limitedEvents.length > 0 ? (
        <View>
          {limitedEvents.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={index === limitedEvents.length - 1}
              colors={colors}
            />
          ))}
          {maxEvents && displayEvents && displayEvents.length > maxEvents && (
            <TouchableOpacity className="flex-row items-center justify-center py-2">
              <Text className="text-primary text-sm">
                View {displayEvents.length - maxEvents} more events
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="py-8 items-center">
          <Clock size={32} color={colors.border} />
          <Text className="text-muted-foreground text-center mt-2">
            {keyEventsOnly
              ? 'No key events yet'
              : 'No activity recorded yet'}
          </Text>
          {onAddActivity && (
            <TouchableOpacity
              className="mt-3 bg-primary px-4 py-2 rounded-lg"
              onPress={onAddActivity}
            >
              <Text className="text-primary-foreground font-medium">Add First Note</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default DealTimeline;
