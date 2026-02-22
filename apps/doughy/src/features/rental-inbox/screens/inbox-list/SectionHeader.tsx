// src/features/rental-inbox/screens/inbox-list/SectionHeader.tsx
// Section header component for inbox list sections

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import type { ThemeColors } from '@/contexts/ThemeContext';
import type { InboxSection } from './types';

interface SectionHeaderProps {
  section: InboxSection;
  colors: ThemeColors;
  collapsed?: boolean;
  onToggle?: () => void;
  isFirst?: boolean;
}

export function SectionHeader({
  section,
  colors,
  collapsed,
  onToggle,
  isFirst,
}: SectionHeaderProps) {
  const IconComponent = section.icon;

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={!onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        marginTop: isFirst ? 0 : SPACING.md,
        marginBottom: SPACING.xs,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: section.iconBgColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING.sm,
        }}
      >
        <IconComponent size={18} color={section.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {section.title}
        </Text>
        {section.description && (
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            {section.description}
          </Text>
        )}
      </View>
      <View
        style={{
          backgroundColor: section.iconBgColor,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: BORDER_RADIUS.full,
        }}
      >
        <Text style={{ color: section.iconColor, fontWeight: '600', fontSize: FONT_SIZES.sm }}>
          {section.data.length}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
