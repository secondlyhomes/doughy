// src/features/vendors/screens/vendor-detail/QuickActions.tsx
// Quick action buttons for vendor communication

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Phone, Mail, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

export interface QuickActionsProps {
  phone: string | null;
  email: string | null;
  onCall: () => void;
  onEmail: () => void;
  onMessage: () => void;
}

export function QuickActions({ phone, email, onCall, onEmail, onMessage }: QuickActionsProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-2 mb-4">
      {phone && (
        <TouchableOpacity
          onPress={onCall}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
            gap: SPACING.xs,
          }}
          activeOpacity={PRESS_OPACITY.DEFAULT}
        >
          <Phone size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            Call
          </Text>
        </TouchableOpacity>
      )}
      {email && (
        <TouchableOpacity
          onPress={onEmail}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
            gap: SPACING.xs,
          }}
          activeOpacity={PRESS_OPACITY.DEFAULT}
        >
          <Mail size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            Email
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onMessage}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: withOpacity(colors.primary, 'light'),
          gap: SPACING.xs,
        }}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        <MessageSquare size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
          Message
        </Text>
      </TouchableOpacity>
    </View>
  );
}
