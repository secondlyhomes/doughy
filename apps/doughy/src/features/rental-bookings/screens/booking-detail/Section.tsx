// src/features/rental-bookings/screens/booking-detail/Section.tsx
// Section component for booking detail screen

import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/components/ui';

interface SectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function Section({ title, icon: Icon, children }: SectionProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center mb-3">
        <Icon size={ICON_SIZES.lg} color={colors.mutedForeground} />
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
