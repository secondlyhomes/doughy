// src/components/deals/MetricCardActions.tsx
// Actions section for fully expanded MetricCard state

import React from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { Button } from '@/components/ui';
import type { MetricAction, CardState } from './metric-card-types';

interface MetricCardActionsProps {
  actions: MetricAction[];
  state: CardState;
  hasActions: boolean;
}

export function MetricCardActions({ actions, state, hasActions }: MetricCardActionsProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Actions Section (only in actionable state) */}
      {state === 'actionable' && actions.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.sm,
            marginTop: SPACING.sm,
          }}
        >
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
              }}
            >
              {action.label}
            </Button>
          ))}
        </View>
      )}

      {/* Hint to expand to actions */}
      {state === 'expanded' && hasActions && (
        <Text
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: SPACING.sm,
          }}
        >
          Tap again for actions
        </Text>
      )}
    </>
  );
}
