// src/features/settings/screens/landlord-ai-settings/AIModeSelector.tsx
// AI mode selection component

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { AIMode } from '@/stores/landlord-settings-store';
import { AI_MODE_INFO, AI_MODES } from './constants';
import { SettingSection } from './SettingSection';

interface AIModeSelectorProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export function AIModeSelector({ currentMode, onModeChange }: AIModeSelectorProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="AI COMMUNICATION MODE">
      <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
        {AI_MODES.map((mode, index) => {
          const info = AI_MODE_INFO[mode];
          const isSelected = currentMode === mode;
          const isLast = index === AI_MODES.length - 1;

          return (
            <TouchableOpacity
              key={mode}
              className="flex-row items-center p-4"
              style={{
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border,
                backgroundColor: isSelected ? withOpacity(colors.primary, 'muted') : 'transparent',
              }}
              onPress={() => onModeChange(mode)}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.muted,
                }}
              >
                {React.cloneElement(info.icon as React.ReactElement, {
                  color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                })}
              </View>
              <View className="flex-1">
                <Text
                  className="font-medium"
                  style={{ color: isSelected ? colors.primary : colors.foreground }}
                >
                  {info.title}
                </Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {info.description}
                </Text>
              </View>
              {isSelected && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SettingSection>
  );
}
