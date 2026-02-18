// src/features/rental-properties/screens/rental-property-detail/Section.tsx
// Collapsible section component for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  /** If true, section can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

export function Section({ title, children, rightElement, collapsible = false, defaultCollapsed = false }: SectionProps) {
  const colors = useThemeColors();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setIsCollapsed((prev) => !prev);
    }
  }, [collapsible]);

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={handleToggle}
        disabled={!collapsible}
        activeOpacity={collapsible ? 0.7 : 1}
        className="flex-row items-center justify-between mb-3"
      >
        <View className="flex-row items-center flex-1">
          <Text
            style={{ color: colors.foreground, fontSize: FONT_SIZES.lg, fontWeight: '600' }}
          >
            {title}
          </Text>
          {collapsible && (
            isCollapsed ? (
              <ChevronDown size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
            ) : (
              <ChevronUp size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
            )
          )}
        </View>
        {rightElement}
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );
}
