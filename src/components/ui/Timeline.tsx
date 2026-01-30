/**
 * Timeline Component
 * A flexible, reusable timeline component for displaying chronological events
 *
 * Consolidates patterns from:
 * - LeadTimeline
 * - DealTimeline
 *
 * Features:
 * - Configurable event type icons and colors
 * - Optional header with add button
 * - AI badge for AI-generated events
 * - Empty state with CTA
 * - Loading and error states
 * - Event limit with "view more" option
 * - Theme-aware with full dark mode support
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { LucideIcon, Calendar, Clock, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  source?: 'user' | 'ai' | 'system';
}

export interface TimelineEventConfig {
  icon: LucideIcon;
  colorKey: keyof ReturnType<typeof useThemeColors>;
  label: string;
}

export interface TimelineProps<T extends TimelineEvent> {
  /** Events to display */
  events?: T[];

  /** Event type configuration mapping */
  eventConfig: Record<string, TimelineEventConfig>;

  /** Add activity button handler */
  onAddActivity?: () => void;

  /** Show header section */
  showHeader?: boolean;

  /** Header title */
  headerTitle?: string;

  /** Header badge text (e.g., "Focus Mode") */
  headerBadge?: string;

  /** Add button text */
  addButtonText?: string;

  /** Maximum number of events to show */
  maxEvents?: number;

  /** Empty state message */
  emptyStateMessage?: string;

  /** Empty state CTA button text */
  emptyCTAText?: string;

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Error message */
  errorMessage?: string;

  /** Custom metadata renderer */
  renderEventMetadata?: (event: T) => React.ReactNode;

  /** View more handler when maxEvents is set */
  onViewMore?: () => void;
}

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

  // Handle future dates
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

// ============================================
// Timeline Item Component
// ============================================

interface TimelineItemProps<T extends TimelineEvent> {
  event: T;
  config: TimelineEventConfig;
  isLast: boolean;
  renderMetadata?: (event: T) => React.ReactNode;
}

function TimelineItem<T extends TimelineEvent>({
  event,
  config,
  isLast,
  renderMetadata,
}: TimelineItemProps<T>) {
  const colors = useThemeColors();
  const Icon = config.icon;
  const iconColor = colors[config.colorKey];
  const bgColor = withOpacity(iconColor, 'medium');

  return (
    <View className="flex-row">
      {/* Timeline connector */}
      <View className="items-center mr-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={ICON_SIZES.md} color={iconColor} />
        </View>
        {!isLast && (
          <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: colors.border }} />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center flex-1">
            <Text
              className="text-sm font-medium"
              style={{ color: colors.foreground }}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            {event.source === 'ai' && (
              <View
                className="px-1.5 py-0.5 rounded ml-2"
                style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
              >
                <Text className="text-[10px] font-medium" style={{ color: colors.primary }}>
                  AI
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs ml-2" style={{ color: colors.mutedForeground }}>
            {formatTimeAgo(event.timestamp)}
          </Text>
        </View>
        {event.description && (
          <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        {renderMetadata?.(event)}
      </View>
    </View>
  );
}

// ============================================
// Main Component
// ============================================

export function Timeline<T extends TimelineEvent>({
  events,
  eventConfig,
  onAddActivity,
  showHeader = true,
  headerTitle = 'Activity',
  headerBadge,
  addButtonText = 'Add',
  maxEvents,
  emptyStateMessage = 'No activity recorded yet',
  emptyCTAText = 'Add First Activity',
  isLoading = false,
  error = null,
  errorMessage = 'Failed to load timeline',
  renderEventMetadata,
  onViewMore,
}: TimelineProps<T>) {
  const { isDark, colors } = useTheme();
  const limitedEvents = maxEvents && events ? events.slice(0, maxEvents) : events;
  const hasMore = maxEvents && events && events.length > maxEvents;

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
        <Text className="text-sm" style={{ color: colors.destructive }}>
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      {showHeader && (
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Calendar size={18} color={colors.mutedForeground} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
              {headerTitle}
            </Text>
            {headerBadge && (
              <View
                className="ml-2 px-2 py-0.5 rounded"
                style={{ backgroundColor: colors.card }}
              >
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {headerBadge}
                </Text>
              </View>
            )}
          </View>
          {onAddActivity && (
            <TouchableOpacity
              className="flex-row items-center px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
              onPress={onAddActivity}
            >
              <Plus size={14} color={colors.primary} />
              <Text className="text-sm ml-1" style={{ color: colors.primary }}>
                {addButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Timeline Items */}
      {limitedEvents && limitedEvents.length > 0 ? (
        <View>
          {limitedEvents.map((event, index) => {
            const config = eventConfig[event.type];

            // Render fallback for missing config instead of skipping
            if (!config) {
              console.warn(`Timeline: No config found for event type "${event.type}". Rendering fallback.`);
              const fallbackConfig: TimelineEventConfig = {
                icon: Calendar, // Generic fallback icon
                colorKey: 'mutedForeground',
                label: 'Unknown Event',
              };
              return (
                <TimelineItem
                  key={event.id}
                  event={event}
                  config={fallbackConfig}
                  isLast={index === limitedEvents.length - 1}
                  renderMetadata={renderEventMetadata}
                />
              );
            }

            return (
              <TimelineItem
                key={event.id}
                event={event}
                config={config}
                isLast={index === limitedEvents.length - 1}
                renderMetadata={renderEventMetadata}
              />
            );
          })}
          {hasMore && (
            <TouchableOpacity
              className="flex-row items-center justify-center py-2"
              onPress={onViewMore}
            >
              <Text className="text-sm" style={{ color: colors.primary }}>
                View {events!.length - maxEvents!} more events
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="py-8 items-center">
          <Clock size={32} color={colors.border} />
          <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
            {emptyStateMessage}
          </Text>
          {onAddActivity && (
            <TouchableOpacity
              className="mt-3 px-4 py-2 rounded-xl overflow-hidden"
              onPress={onAddActivity}
              style={{ minWidth: 120 }}
            >
              {Platform.OS === 'ios' && isLiquidGlassSupported ? (
                <LiquidGlassView
                  style={StyleSheet.absoluteFill}
                  colorScheme={isDark ? 'dark' : 'light'}
                />
              ) : Platform.OS !== 'web' ? (
                <BlurView
                  intensity={50}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: withOpacity(colors.primary, 'light') }]}
                />
              )}
              <Text className="font-medium text-center" style={{ color: colors.foreground }}>
                {emptyCTAText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
