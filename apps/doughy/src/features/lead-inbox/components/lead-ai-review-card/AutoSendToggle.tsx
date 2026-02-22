// src/features/lead-inbox/components/lead-ai-review-card/AutoSendToggle.tsx
// Fire & Forget mode toggle for high-confidence auto-send

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { styles } from './styles';

interface AutoSendToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AutoSendToggle({ isEnabled, onToggle }: AutoSendToggleProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.autoSendRow,
        { backgroundColor: withOpacity(colors.success, 'subtle') },
      ]}
    >
      <View style={styles.autoSendInfo}>
        <Zap size={16} color={colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.autoSendTitle, { color: colors.foreground }]}>
            Fire & Forget Mode
          </Text>
          <Text style={[styles.autoSendDescription, { color: colors.mutedForeground }]}>
            Auto-send high-confidence responses for this lead type
          </Text>
        </View>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.muted, true: colors.success }}
        thumbColor={colors.background}
      />
    </View>
  );
}
