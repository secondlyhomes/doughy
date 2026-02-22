// src/features/admin/screens/ai-security-dashboard/DashboardHelpers.tsx
// Reusable sub-components for the AI Security Dashboard layout

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface StatCardProps {
  value: number;
  label: string;
  isAlert: boolean;
  alertColor?: string;
  colors: ReturnType<typeof useThemeColors>;
}

export function StatCard({ value, label, isAlert, alertColor, colors }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isAlert && alertColor ? alertColor + '20' : colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: isAlert && alertColor ? alertColor : colors.foreground,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  colors: ReturnType<typeof useThemeColors>;
}

export function SectionHeader({ title, colors }: SectionHeaderProps) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

interface SectionHeaderWithActionProps {
  title: string;
  actionLabel: string;
  onAction: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

export function SectionHeaderWithAction({ title, actionLabel, onAction, colors }: SectionHeaderWithActionProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.foreground,
        }}
      >
        {title}
      </Text>
      <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

interface EmptyCardProps {
  message: string;
  colors: ReturnType<typeof useThemeColors>;
}

export function EmptyCard({ message, colors }: EmptyCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 16,
        alignItems: 'center',
        marginBottom: SPACING.lg,
      }}
    >
      <Text style={{ color: colors.mutedForeground }}>{message}</Text>
    </View>
  );
}
