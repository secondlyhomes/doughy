// src/features/vendors/components/ChannelSelector.tsx
// Channel selection buttons for MessageVendorSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { SPACING, FONT_SIZES, BORDER_RADIUS, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { MessageChannel, ChannelOption } from './message-vendor-types';

export interface ChannelSelectorProps {
  channel: MessageChannel;
  onChannelChange: (channel: MessageChannel) => void;
  availableChannels: ChannelOption[];
}

export function ChannelSelector({
  channel,
  onChannelChange,
  availableChannels,
}: ChannelSelectorProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Send Via">
      <View className="flex-row gap-2">
        {availableChannels.map((option) => {
          const Icon = option.icon;
          const isSelected = channel === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChannelChange(option.value)}
              style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: isSelected
                    ? withOpacity(colors.primary, 'light')
                    : colors.muted,
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: colors.primary,
                  gap: SPACING.xs,
                },
              ]}
              activeOpacity={PRESS_OPACITY.DEFAULT}
            >
              <Icon
                size={18}
                color={isSelected ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={{
                  color: isSelected ? colors.primary : colors.mutedForeground,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheetSection>
  );
}
