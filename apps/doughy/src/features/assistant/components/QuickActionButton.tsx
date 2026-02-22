// src/features/assistant/components/QuickActionButton.tsx
// Quick action button for ActionsTab

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

import { styles } from './actions-tab-styles';

interface QuickActionButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  onPress: () => void;
}

export function QuickActionButton({ icon: Icon, label, onPress }: QuickActionButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: colors.muted }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Quick action: ${label}`}
    >
      <Icon size={ICON_SIZES.ml} color={colors.foreground} />
      <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
