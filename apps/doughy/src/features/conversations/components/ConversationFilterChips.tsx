// src/features/conversations/components/ConversationFilterChips.tsx
// Filter chip bar for conversation type filtering

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { ConversationType, TYPE_CONFIG } from './conversation-types';

// ============================================
// Filter Chips
// ============================================

export interface FilterChipsProps {
  activeFilters: ConversationType[];
  onToggleFilter: (type: ConversationType) => void;
}

export function FilterChips({ activeFilters, onToggleFilter }: FilterChipsProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.xs,
      }}
    >
      {Object.entries(TYPE_CONFIG).map(([type, config]) => {
        const isActive = activeFilters.length === 0 || activeFilters.includes(type as ConversationType);
        return (
          <TouchableOpacity
            key={type}
            onPress={() => onToggleFilter(type as ConversationType)}
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: isActive ? withOpacity(config.color, 'light') : colors.muted,
              borderWidth: 1,
              borderColor: isActive ? config.color : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: isActive ? config.color : colors.mutedForeground,
              }}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
