// src/features/settings/screens/landlord-ai-settings/ResponseStyleSelector.tsx
// Response style selection component

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { ResponseStyle } from '@/stores/landlord-settings-store';
import { RESPONSE_STYLE_INFO, RESPONSE_STYLES } from './constants';
import { SettingSection } from './SettingSection';

interface ResponseStyleSelectorProps {
  currentStyle: ResponseStyle;
  onStyleChange: (style: ResponseStyle) => void;
}

export function ResponseStyleSelector({ currentStyle, onStyleChange }: ResponseStyleSelectorProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="RESPONSE STYLE">
      <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
        {RESPONSE_STYLES.map((style, index) => {
          const info = RESPONSE_STYLE_INFO[style];
          const isSelected = currentStyle === style;
          const isLast = index === RESPONSE_STYLES.length - 1;

          return (
            <TouchableOpacity
              key={style}
              className="flex-row items-center p-4"
              style={!isLast ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
              onPress={() => onStyleChange(style)}
            >
              <View className="flex-1">
                <Text
                  className="font-medium"
                  style={{ color: isSelected ? colors.primary : colors.foreground }}
                >
                  {info.title}
                </Text>
                <Text className="text-sm italic mt-1" style={{ color: colors.mutedForeground }}>
                  "{info.example}"
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
