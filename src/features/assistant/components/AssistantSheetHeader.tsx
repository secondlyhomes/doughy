// src/features/assistant/components/AssistantSheetHeader.tsx
// Header for the AI Assistant bottom sheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

import { styles } from './deal-assistant-styles';

interface AssistantSheetHeaderProps {
  dealId?: string;
  contextOneLiner: string;
  onClose: () => void;
}

export function AssistantSheetHeader({ dealId, contextOneLiner, onClose }: AssistantSheetHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        <Sparkles size={ICON_SIZES.lg} color={colors.primary} />
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Assistant
          </Text>
          {dealId && (
            <Text
              style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {contextOneLiner}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Close AI Assistant"
      >
        <X size={ICON_SIZES.lg} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}
