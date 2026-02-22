// src/components/ui/ContextSwitcher.tsx
// Animated segmented control for switching between Deal/Property context
// Used in EntityHeader for seamless navigation between related entities

import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface ContextOption {
  /** Unique identifier for this context */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon to show before label */
  icon?: React.ReactNode;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Reason for being disabled (shown as tooltip) */
  disabledReason?: string;
}

export interface ContextSwitcherProps {
  /** Available context options */
  contexts: ContextOption[];
  /** Currently selected context id */
  value: string;
  /** Callback when context changes */
  onChange: (id: string) => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional className for container */
  className?: string;
}

// ============================================
// ContextSwitcher Component
// ============================================

export function ContextSwitcher({
  contexts,
  value,
  onChange,
  size = 'md',
  className,
}: ContextSwitcherProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [segmentWidths, setSegmentWidths] = React.useState<number[]>([]);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Calculate the active index
  const activeIndex = contexts.findIndex((c) => c.id === value);

  // Update animation when active index changes
  useEffect(() => {
    if (segmentWidths.length === contexts.length && activeIndex >= 0) {
      // Calculate the x position for the pill
      const targetX = segmentWidths
        .slice(0, activeIndex)
        .reduce((sum, w) => sum + w, 0);

      Animated.spring(slideAnim, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeIndex, segmentWidths, slideAnim, contexts.length]);

  // Handle container layout
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle segment layout
  const handleSegmentLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      setSegmentWidths((prev) => {
        const newWidths = [...prev];
        newWidths[index] = width;
        return newWidths;
      });
    },
    []
  );

  // Handle press
  const handlePress = useCallback(
    (context: ContextOption) => {
      if (context.disabled) {
        // Could show a tooltip or alert here
        return;
      }
      if (context.id !== value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(context.id);
      }
    },
    [value, onChange]
  );

  const paddingY = size === 'sm' ? SPACING.xs : SPACING.sm;
  const paddingX = size === 'sm' ? SPACING.sm : SPACING.md;
  const fontSize = size === 'sm' ? 13 : 14;

  // Get the width of the active pill
  const activePillWidth = segmentWidths[activeIndex] || 0;

  return (
    <View
      className={className}
      onLayout={handleContainerLayout}
      style={{
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.full,
        padding: 3,
        backgroundColor: withOpacity(colors.muted, 'strong'),
      }}
    >
      {/* Animated pill indicator */}
      {segmentWidths.length === contexts.length && activeIndex >= 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: activePillWidth,
            height: '100%',
            borderRadius: BORDER_RADIUS.full,
            backgroundColor: colors.background,
            ...getShadowStyle(colors, { size: 'sm' }),
            transform: [{ translateX: slideAnim }],
          }}
        />
      )}

      {/* Segments */}
      {contexts.map((context, index) => {
        const isActive = context.id === value;
        const isDisabled = context.disabled;

        return (
          <Pressable
            key={context.id}
            onLayout={(e) => handleSegmentLayout(index, e)}
            onPress={() => handlePress(context)}
            disabled={isDisabled}
            accessibilityLabel={
              isDisabled
                ? `${context.label} (${context.disabledReason || 'unavailable'})`
                : `Switch to ${context.label}`
            }
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: isDisabled }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: paddingY,
              paddingHorizontal: paddingX,
              opacity: isDisabled ? 0.4 : 1,
            }}
          >
            {context.icon && (
              <View style={{ marginRight: SPACING.xs }}>
                {context.icon}
              </View>
            )}
            <Text
              style={{
                fontSize,
                fontWeight: '600',
                color: isActive ? colors.foreground : colors.mutedForeground,
              }}
            >
              {context.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ContextSwitcher;
