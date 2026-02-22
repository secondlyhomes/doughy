// src/features/settings/screens/email-integration/HowItWorksSection.tsx
// How it works section for email integration screen

import React from 'react';
import { View, Text } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

function StepItem({ number, title, description }: StepItemProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row mb-4">
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
      >
        <Text className="font-bold" style={{ color: colors.primary }}>{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-medium" style={{ color: colors.foreground }}>
          {title}
        </Text>
        <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function HowItWorksSection() {
  const colors = useThemeColors();

  return (
    <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
      <StepItem
        number={1}
        title="Connect your Gmail"
        description="OpenClaw only requests read-only access to scan for platform emails"
      />

      <StepItem
        number={2}
        title="Automatic scanning"
        description="We check for new emails from Airbnb, Furnished Finder, Zillow, and other platforms"
      />

      <View className="flex-row">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
        >
          <Text className="font-bold" style={{ color: colors.primary }}>3</Text>
        </View>
        <View className="flex-1">
          <Text className="font-medium" style={{ color: colors.foreground }}>
            Inquiries in your inbox
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            New inquiries appear in OpenClaw ready for AI-assisted responses
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SecurityNote() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-lg p-4 flex-row"
      style={{ backgroundColor: withOpacity(colors.success, 'muted') }}
    >
      <Shield size={20} color={colors.success} />
      <View className="flex-1 ml-3">
        <Text className="font-medium" style={{ color: colors.success }}>
          Your data is safe
        </Text>
        <Text className="text-sm mt-1" style={{ color: colors.foreground }}>
          OpenClaw uses read-only access. We never modify, delete, or send emails from your account.
          You can revoke access anytime.
        </Text>
      </View>
    </View>
  );
}
