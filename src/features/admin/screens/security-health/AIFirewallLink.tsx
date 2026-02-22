// src/features/admin/screens/security-health/AIFirewallLink.tsx
// Navigation card linking to the AI Security Firewall dashboard

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, ICON_SIZES, SPACING } from '@/constants/design-tokens';

export function AIFirewallLink() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(admin)/security/ai-firewall')}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 16,
        marginBottom: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: BORDER_RADIUS['2xl'],
          backgroundColor: colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name="shield" size={ICON_SIZES.lg} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
          AI Security Firewall
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          Circuit breakers, threat tracking, pattern monitoring
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={ICON_SIZES.lg} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
