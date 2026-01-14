// src/features/deals/components/StrategySelector.tsx
// Component for selecting deal strategy type

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, FileText, Home } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { DealStrategy, DEAL_STRATEGY_CONFIG } from '../types';

// Icon mapping for strategies
const STRATEGY_ICONS: Record<DealStrategy, React.ComponentType<{ size: number; color: string }>> = {
  cash: DollarSign,
  seller_finance: FileText,
  subject_to: Home,
};

interface StrategySelectorProps {
  value: DealStrategy;
  onChange: (strategy: DealStrategy) => void;
  disabled?: boolean;
}

export function StrategySelector({
  value,
  onChange,
  disabled = false,
}: StrategySelectorProps) {
  const colors = useThemeColors();
  const strategies = Object.keys(DEAL_STRATEGY_CONFIG) as DealStrategy[];

  return (
    <View className="flex-row gap-2">
      {strategies.map((strategy) => {
        const config = DEAL_STRATEGY_CONFIG[strategy];
        const Icon = STRATEGY_ICONS[strategy];
        const isSelected = value === strategy;

        return (
          <TouchableOpacity
            key={strategy}
            className="flex-1 p-3 rounded-lg items-center"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.muted,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : 'transparent',
            }}
            onPress={() => !disabled && onChange(strategy)}
            disabled={disabled}
            accessibilityLabel={`${config.label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Icon
              size={24}
              color={isSelected ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              className="text-xs font-medium mt-1 text-center"
              style={{
                color: isSelected ? colors.primaryForeground : colors.foreground,
              }}
              numberOfLines={2}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
