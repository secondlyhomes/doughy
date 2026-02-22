// src/features/vendors/components/AIComposeButton.tsx
// AI compose button for MessageVendorSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui';
import { SPACING, FONT_SIZES, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

export interface AIComposeButtonProps {
  onPress: () => void;
  isGenerating: boolean;
}

export function AIComposeButton({ onPress, isGenerating }: AIComposeButtonProps) {
  const colors = useThemeColors();

  return (
    <View className="px-4 mb-4">
      <TouchableOpacity
        onPress={onPress}
        disabled={isGenerating}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: BORDER_RADIUS.lg,
            backgroundColor: withOpacity(colors.primary, 'light'),
            gap: SPACING.sm,
          },
        ]}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        {isGenerating ? (
          <LoadingSpinner size="small" />
        ) : (
          <Sparkles size={ICON_SIZES.lg} color={colors.primary} />
        )}
        <Text
          style={{
            color: colors.primary,
            fontSize: FONT_SIZES.base,
            fontWeight: '600',
          }}
        >
          {isGenerating ? 'Composing...' : 'AI Compose Message'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
