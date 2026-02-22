// src/features/deals/screens/cockpit/NextActionButton.tsx
// Next Action button component for deal cockpit

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { useNextAction } from '../../hooks/useNextAction';
import type { Deal } from '../../types';

interface NextActionButtonProps {
  deal: Deal;
  onPress: () => void;
}

export function NextActionButton({ deal, onPress }: NextActionButtonProps) {
  const colors = useThemeColors();
  const nextAction = useNextAction(deal);

  if (!nextAction) return null;

  const isHighPriority = nextAction.priority === 'high';
  const buttonBg = isHighPriority ? colors.primary : colors.card;
  const buttonText = isHighPriority ? colors.primaryForeground : colors.foreground;

  return (
    <TouchableOpacity
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: buttonBg,
        ...getShadowStyle(colors, { size: 'md' }),
      }}
      onPress={onPress}
      accessibilityLabel={`Next action: ${nextAction.action}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="text-xs font-medium mb-1"
            style={{
              color: isHighPriority ? `${buttonText}90` : colors.mutedForeground,
            }}
          >
            {nextAction.isOverdue ? 'OVERDUE' : 'NEXT ACTION'}
          </Text>
          <Text
            className="text-base font-semibold"
            style={{ color: buttonText }}
            numberOfLines={2}
          >
            {nextAction.action}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: isHighPriority
              ? withOpacity(colors.card, 'light')
              : withOpacity(colors.primary, 'light'),
          }}
        >
          <ChevronRight
            size={20}
            color={isHighPriority ? buttonText : colors.primary}
          />
        </View>
      </View>
      {nextAction.dueDate && (
        <View className="flex-row items-center mt-2">
          <Clock
            size={12}
            color={
              isHighPriority ? `${buttonText}80` : colors.mutedForeground
            }
          />
          <Text
            className="text-xs ml-1"
            style={{
              color: isHighPriority ? `${buttonText}80` : colors.mutedForeground,
            }}
          >
            Due: {new Date(nextAction.dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
