// src/features/deals/components/StrategySelector.tsx
// Component for selecting deal strategy type

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DollarSign, FileText, Home, Repeat, Hammer, RefreshCw, Building } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DealStrategy, DEAL_STRATEGY_CONFIG } from '../types';

// Icon mapping for strategies
const STRATEGY_ICONS: Record<DealStrategy, React.ComponentType<{ size: number; color: string }>> = {
  cash: DollarSign,
  seller_finance: FileText,
  subject_to: Home,
  wholesale: Repeat,
  fix_and_flip: Hammer,
  brrrr: RefreshCw,
  buy_and_hold: Building,
};

// Short labels that fit better in compact view
const SHORT_LABELS: Record<DealStrategy, string> = {
  cash: 'Cash',
  seller_finance: 'Seller Fi',
  subject_to: 'Sub-To',
  wholesale: 'Wholesale',
  fix_and_flip: 'Fix & Flip',
  brrrr: 'BRRRR',
  buy_and_hold: 'Buy & Hold',
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {strategies.map((strategy) => {
        const config = DEAL_STRATEGY_CONFIG[strategy];
        const Icon = STRATEGY_ICONS[strategy];
        const isSelected = value === strategy;
        const shortLabel = SHORT_LABELS[strategy];

        return (
          <TouchableOpacity
            key={strategy}
            className="px-4 py-3 rounded-xl flex-row items-center gap-2"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.muted,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : 'transparent',
              opacity: disabled ? 0.5 : 1,
            }}
            onPress={() => !disabled && onChange(strategy)}
            disabled={disabled}
            accessibilityLabel={`${config.label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Icon
              size={18}
              color={isSelected ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              className="text-sm font-semibold"
              style={{
                color: isSelected ? colors.primaryForeground : colors.foreground,
              }}
            >
              {shortLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
