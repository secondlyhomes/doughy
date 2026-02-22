// src/features/focus/components/TouchTypeSelector.tsx
// Pill selector for call touch type (First Call, Follow-up, Voicemail)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';
import { TouchType } from '../hooks/useContactTouches';
import { TOUCH_TYPES } from './touch-log-types';

interface TouchTypeSelectorProps {
  touchType: TouchType;
  onSelect: (type: TouchType) => void;
}

export function TouchTypeSelector({ touchType, onSelect }: TouchTypeSelectorProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Call Type">
      <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
        {TOUCH_TYPES.map((type) => {
          const isSelected = touchType === type.value;
          const IconComponent = type.icon;
          return (
            <TouchableOpacity
              key={type.value}
              onPress={() => onSelect(type.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.full,
                backgroundColor: isSelected ? colors.primary : colors.muted,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <IconComponent
                size={ICON_SIZES.sm}
                color={isSelected ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '500',
                  color: isSelected ? colors.primaryForeground : colors.foreground,
                }}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheetSection>
  );
}
