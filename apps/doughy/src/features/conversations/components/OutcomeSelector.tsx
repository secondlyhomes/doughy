// src/features/conversations/components/OutcomeSelector.tsx
// Call outcome selector for call logging

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { CallOutcome } from './call-logger-types';

interface OutcomeSelectorProps {
  value?: CallOutcome;
  onChange: (outcome: CallOutcome) => void;
}

export function OutcomeSelector({ value, onChange }: OutcomeSelectorProps) {
  const colors = useThemeColors();

  const outcomes = [
    { value: 'answered' as const, label: 'Answered', color: colors.success },
    { value: 'voicemail' as const, label: 'Voicemail', color: colors.warning },
    { value: 'no_answer' as const, label: 'No Answer', color: colors.destructive },
    { value: 'busy' as const, label: 'Busy', color: colors.mutedForeground },
  ];

  const handlePress = useCallback((outcome: CallOutcome) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(outcome);
  }, [onChange]);

  return (
    <View style={{ gap: SPACING.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
        Outcome
      </Text>
      <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
        {outcomes.map((outcome) => (
          <TouchableOpacity
            key={outcome.value}
            onPress={() => handlePress(outcome.value)}
            style={{
              flex: 1,
              paddingVertical: SPACING.sm,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: value === outcome.value ? withOpacity(outcome.color, 'light') : colors.muted,
              borderWidth: 1,
              borderColor: value === outcome.value ? outcome.color : colors.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: value === outcome.value ? outcome.color : colors.foreground,
              }}
            >
              {outcome.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
