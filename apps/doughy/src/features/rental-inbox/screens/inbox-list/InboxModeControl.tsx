// src/features/rental-inbox/screens/inbox-list/InboxModeControl.tsx
// Animated segment control for Leads/Residents toggle

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { INBOX_MODES, SEGMENT_CONTROL_HEIGHT } from './constants';
import type { InboxMode } from './types';

interface InboxModeControlProps {
  value: InboxMode;
  onChange: (mode: InboxMode) => void;
  leadCount: number;
  residentCount: number;
}

export function InboxModeControl({ value, onChange, leadCount, residentCount }: InboxModeControlProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidths, setSegmentWidths] = useState<number[]>([]);

  const activeIndex = INBOX_MODES.findIndex((m) => m.id === value);

  useEffect(() => {
    if (segmentWidths.length === INBOX_MODES.length && activeIndex >= 0) {
      const targetX = segmentWidths.slice(0, activeIndex).reduce((sum, w) => sum + w, 0);
      Animated.spring(slideAnim, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeIndex, segmentWidths, slideAnim]);

  const handleSegmentLayout = useCallback((index: number, width: number) => {
    setSegmentWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  }, []);

  const handlePress = useCallback(
    (mode: InboxMode) => {
      if (mode !== value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(mode);
      }
    },
    [value, onChange]
  );

  const activePillWidth = segmentWidths[activeIndex] || 0;
  const counts: Record<InboxMode, number> = { leads: leadCount, residents: residentCount };

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.full,
        padding: 3,
        backgroundColor: withOpacity(colors.muted, 'strong'),
      }}
    >
      {/* Animated pill indicator */}
      {segmentWidths.length === INBOX_MODES.length && activeIndex >= 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: activePillWidth,
            height: SEGMENT_CONTROL_HEIGHT,
            borderRadius: BORDER_RADIUS.full,
            backgroundColor: colors.background,
            ...getShadowStyle(colors, { size: 'sm' }),
            transform: [{ translateX: slideAnim }],
          }}
        />
      )}

      {/* Segments */}
      {INBOX_MODES.map((mode, index) => {
        const isActive = mode.id === value;
        const IconComponent = mode.icon;
        const count = counts[mode.id] || 0;

        return (
          <TouchableOpacity
            key={mode.id}
            onLayout={(e) => handleSegmentLayout(index, e.nativeEvent.layout.width)}
            onPress={() => handlePress(mode.id)}
            accessibilityLabel={`${mode.label} (${count})`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: SEGMENT_CONTROL_HEIGHT,
              gap: SPACING.xs,
            }}
          >
            <IconComponent
              size={16}
              color={isActive ? colors.foreground : colors.mutedForeground}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isActive ? colors.foreground : colors.mutedForeground,
              }}
            >
              {mode.label}
            </Text>
            {count > 0 && (
              <View
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'light')
                    : withOpacity(colors.muted, 'strong'),
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: BORDER_RADIUS.full,
                  minWidth: 20,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isActive ? colors.primary : colors.mutedForeground,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
