// Add Lead Screen - Status Picker
// Dropdown selector for lead status

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import { LeadStatus } from '../../types';
import { STATUS_OPTIONS } from './add-lead-constants';

interface LeadStatusPickerProps {
  value: LeadStatus | undefined;
  showPicker: boolean;
  onTogglePicker: () => void;
  onSelect: (status: LeadStatus) => void;
  getStatusLabel: (status: LeadStatus | undefined) => string;
}

export function LeadStatusPicker({
  value,
  showPicker,
  onTogglePicker,
  onSelect,
  getStatusLabel,
}: LeadStatusPickerProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Status</Text>
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-lg px-3 py-3"
        style={{ backgroundColor: colors.muted }}
        onPress={onTogglePicker}
      >
        <Text className="text-base" style={{ color: colors.foreground }}>
          {getStatusLabel(value)}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {showPicker && (
        <View className="rounded-lg mt-2 overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className="px-4 py-3"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: value === option.value ? withOpacity(colors.primary, 'muted') : 'transparent'
              }}
              onPress={() => onSelect(option.value)}
            >
              <Text
                className="text-base"
                style={{
                  color: value === option.value ? colors.primary : colors.foreground,
                  fontWeight: value === option.value ? '500' : 'normal'
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
