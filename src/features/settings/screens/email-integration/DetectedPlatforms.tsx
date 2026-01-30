// src/features/settings/screens/email-integration/DetectedPlatforms.tsx
// Detected platforms display for email integration

import React from 'react';
import { View, Text } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import { PLATFORM_INFO } from './constants';

interface DetectedPlatformsProps {
  platforms: string[];
}

export function DetectedPlatforms({ platforms }: DetectedPlatformsProps) {
  const colors = useThemeColors();

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
      <View className="flex-row flex-wrap gap-2">
        {platforms.map((platform) => {
          const info = PLATFORM_INFO[platform.toLowerCase()] || {
            name: platform,
            icon: <Building2 size={16} />,
            color: colors.primary,
          };

          return (
            <View
              key={platform}
              className="flex-row items-center px-3 py-2 rounded-full"
              style={{ backgroundColor: withOpacity(info.color, 'muted') }}
            >
              {React.cloneElement(info.icon as React.ReactElement, {
                color: info.color,
              })}
              <Text className="ml-2 text-sm font-medium" style={{ color: info.color }}>
                {info.name}
              </Text>
            </View>
          );
        })}
      </View>
      <Text className="text-sm mt-3" style={{ color: colors.mutedForeground }}>
        MoltBot found emails from these platforms in your inbox
      </Text>
    </View>
  );
}
