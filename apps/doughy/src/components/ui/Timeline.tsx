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
import { Calendar, Clock, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LiquidGlassView, isLiquidGlassSupported } from '@/lib/liquid-glass';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES, GLASS_INTENSITY } from '@/constants/design-tokens';
import { TimelineItem } from '@/components/ui/TimelineItem';
import type { TimelineEvent, TimelineEventConfig, TimelineProps } from '@/components/ui/timeline-types';

// Re-export types for consumers
export type { TimelineEvent, TimelineEventConfig, TimelineProps } from '@/components/ui/timeline-types';

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
          <Clock size={ICON_SIZES['2xl']} color={colors.border} />
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
                  intensity={GLASS_INTENSITY.medium}
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
