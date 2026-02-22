// src/features/admin/screens/ai-security-dashboard/PatternHitRow.tsx
// Single pattern row showing severity badge, description, and hit count

import React from 'react';
import { View, Text } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';

interface PatternRowProps {
  pattern: {
    id: string;
    severity: string;
    description: string | null;
    threatType: string;
    hitCount: number;
  };
  colors: ReturnType<typeof useThemeColors>;
}

export function PatternRow({ pattern, colors }: PatternRowProps) {
  const getSeverityColor = () => {
    if (pattern.severity === 'critical') return colors.destructive;
    if (pattern.severity === 'high') return colors.warning;
    return colors.foreground;
  };

  const severityColor = getSeverityColor();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          backgroundColor: severityColor + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          marginRight: 8,
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: '600', color: severityColor }}>
          {pattern.severity.toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.foreground }} numberOfLines={1}>
          {pattern.description || pattern.threatType}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
        {pattern.hitCount}
      </Text>
    </View>
  );
}
