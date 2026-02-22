// src/features/dev/screens/simulate-inquiry/SuccessToast.tsx
// Tappable success banner that navigates to the created conversation

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface SuccessToastProps {
  conversationId: string;
  onPress: () => void;
}

export function SuccessToast({ conversationId, onPress }: SuccessToastProps) {
  const colors = useThemeColors();

  if (!conversationId) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: withOpacity(colors.success, 'light'),
        marginTop: SPACING.md,
        gap: SPACING.sm,
      }}
    >
      <CheckCircle2 size={20} color={colors.success} />
      <Text style={{ flex: 1, color: colors.success, fontWeight: '500' }}>
        Last inquiry created! Tap to view.
      </Text>
      <ArrowRight size={18} color={colors.success} />
    </TouchableOpacity>
  );
}
