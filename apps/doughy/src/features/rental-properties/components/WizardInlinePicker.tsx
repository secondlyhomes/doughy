// src/features/rental-properties/components/WizardInlinePicker.tsx
// Reusable inline picker for the rental property form wizard

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { withOpacity } from '@/lib/design-utils';
import type { ThemeColors } from '@/contexts/ThemeContext';

interface WizardInlinePickerProps<T extends string> {
  label: string;
  value: T | undefined;
  options: { label: string; value: T }[];
  placeholder: string;
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
  onChange: (value: T) => void;
  colors: ThemeColors;
}

function getPickerLabel<T extends string>(
  value: T | undefined,
  options: { label: string; value: T }[],
  placeholder: string
) {
  const option = options.find(o => o.value === value);
  return option?.label || placeholder;
}

export function WizardInlinePicker<T extends string>({
  label,
  value,
  options,
  placeholder,
  showPicker,
  setShowPicker,
  onChange,
  colors,
}: WizardInlinePickerProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>{label}</Text>
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-lg px-3 py-3"
        style={{ backgroundColor: colors.muted }}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text className="text-base" style={{ color: colors.foreground }}>
          {getPickerLabel(value, options, placeholder)}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {showPicker && (
        <View
          className="rounded-lg mt-2 overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className="px-4 py-3"
              style={{
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: value === option.value ? withOpacity(colors.primary, 'muted') : 'transparent',
              }}
              onPress={() => {
                onChange(option.value);
                setShowPicker(false);
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: value === option.value ? colors.primary : colors.foreground,
                  fontWeight: value === option.value ? '500' : 'normal',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
