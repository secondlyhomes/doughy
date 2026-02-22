// src/features/pipeline/screens/pipeline/SegmentControl.tsx
// Animated segment control for pipeline tabs

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { SEGMENTS, SEGMENT_CONTROL_HEIGHT } from './constants';
import type { PipelineSegment } from './types';

export interface SegmentControlProps {
  value: PipelineSegment;
  onChange: (segment: PipelineSegment) => void;
  counts: Record<PipelineSegment, number>;
}

export function SegmentControl({ value, onChange, counts }: SegmentControlProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidths, setSegmentWidths] = useState<number[]>([]);

  const activeIndex = SEGMENTS.findIndex((s) => s.id === value);

  useEffect(() => {
    if (segmentWidths.length === SEGMENTS.length && activeIndex >= 0) {
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
    (segment: PipelineSegment) => {
      if (segment !== value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(segment);
      }
    },
    [value, onChange]
  );

  const activePillWidth = segmentWidths[activeIndex] || 0;

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
      {segmentWidths.length === SEGMENTS.length && activeIndex >= 0 && (
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
      {SEGMENTS.map((segment, index) => {
        const isActive = segment.id === value;
        const IconComponent = segment.icon;
        const count = counts[segment.id] || 0;

        return (
          <TouchableOpacity
            key={segment.id}
            onLayout={(e) => handleSegmentLayout(index, e.nativeEvent.layout.width)}
            onPress={() => handlePress(segment.id)}
            accessibilityLabel={`${segment.label} (${count})`}
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
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
                color: isActive ? colors.foreground : colors.mutedForeground,
              }}
            >
              {segment.label}
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
                    fontSize: FONT_SIZES.xs,
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
