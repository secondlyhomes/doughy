// src/features/deals/components/WeHandleToggles.tsx
// Component for toggling "What We Handle" options in seller report

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Square, Package, DollarSign, Search, Link2, Wrench } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { WeHandleOptions } from '../types';
import { WE_HANDLE_CONFIG } from '../data/mockSellerReport';

// Icon mapping for options
const OPTION_ICONS: Record<keyof WeHandleOptions, React.ComponentType<{ size: number; color: string }>> = {
  cleanout: Package,
  closing_costs: DollarSign,
  title_search: Search,
  outstanding_liens: Link2,
  repairs: Wrench,
};

interface WeHandleTogglesProps {
  value: WeHandleOptions;
  onChange: (options: WeHandleOptions) => void;
  disabled?: boolean;
}

export function WeHandleToggles({
  value,
  onChange,
  disabled = false,
}: WeHandleTogglesProps) {
  const colors = useThemeColors();
  const options = Object.keys(WE_HANDLE_CONFIG) as (keyof WeHandleOptions)[];

  const toggleOption = (option: keyof WeHandleOptions) => {
    if (disabled) return;
    onChange({
      ...value,
      [option]: !value[option],
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">What We Handle</CardTitle>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>
          Select what you'll cover as the buyer
        </Text>
      </CardHeader>
      <CardContent>
        {options.map((option) => {
          const config = WE_HANDLE_CONFIG[option];
          const Icon = OPTION_ICONS[option];
          const isChecked = value[option];

          return (
            <TouchableOpacity
              key={option}
              className="flex-row items-start py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
              onPress={() => toggleOption(option)}
              disabled={disabled}
              accessibilityLabel={`${config.label}, ${isChecked ? 'checked' : 'unchecked'}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
            >
              {/* Checkbox */}
              <View
                className="w-6 h-6 rounded items-center justify-center mr-3"
                style={{
                  backgroundColor: isChecked ? colors.primary : 'transparent',
                  borderWidth: isChecked ? 0 : 2,
                  borderColor: colors.border,
                }}
              >
                {isChecked && <Check size={16} color={colors.primaryForeground} />}
              </View>

              {/* Icon */}
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: colors.muted }}
              >
                <Icon size={16} color={isChecked ? colors.primary : colors.mutedForeground} />
              </View>

              {/* Text */}
              <View className="flex-1">
                <Text
                  className="text-sm font-medium"
                  style={{ color: isChecked ? colors.foreground : colors.mutedForeground }}
                >
                  {config.label}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                  {config.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </CardContent>
    </Card>
  );
}
