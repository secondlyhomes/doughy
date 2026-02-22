import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { formatTimeAgo } from '@/components/ui/timeline-helpers';
import { TimelineEvent, TimelineItemProps } from '@/components/ui/timeline-types';

export function TimelineItem<T extends TimelineEvent>({
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
