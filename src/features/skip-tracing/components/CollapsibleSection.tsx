// src/features/skip-tracing/components/CollapsibleSection.tsx
// Collapsible section with title, icon, count badge, and expandable content

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

export function CollapsibleSection({
  title,
  icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.muted,
          padding: 12,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon}
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginLeft: 8 }}>
            {title}
          </Text>
          <Badge variant="secondary" style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 12 }}>{count}</Text>
          </Badge>
        </View>
        {isOpen ? (
          <ChevronUp size={ICON_SIZES.ml} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={ICON_SIZES.ml} color={colors.mutedForeground} />
        )}
      </Pressable>
      {isOpen && <View style={{ paddingTop: 8 }}>{children}</View>}
    </View>
  );
}
