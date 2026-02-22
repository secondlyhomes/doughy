// src/features/focus/components/OutcomeSelector.tsx
// Pill selector for call outcome (Connected, No Answer, Left Voicemail, Callback Scheduled)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';
import { TouchOutcome } from '../hooks/useContactTouches';
import { OUTCOMES } from './touch-log-types';

interface OutcomeSelectorProps {
  outcome: TouchOutcome;
  onSelect: (outcome: TouchOutcome) => void;
}

export function OutcomeSelector({ outcome, onSelect }: OutcomeSelectorProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Outcome">
      <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
        {OUTCOMES.map((o) => {
          const isSelected = outcome === o.value;
          const IconComponent = o.icon;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.full,
                backgroundColor: isSelected
                  ? o.value === 'connected' ? colors.success
                  : o.value === 'no_answer' ? colors.warning
                  : colors.primary
                  : colors.muted,
                borderWidth: 1,
                borderColor: isSelected
                  ? o.value === 'connected' ? colors.success
                  : o.value === 'no_answer' ? colors.warning
                  : colors.primary
                  : colors.border,
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
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheetSection>
  );
}
