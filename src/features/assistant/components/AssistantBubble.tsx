// src/features/assistant/components/AssistantBubble.tsx
// Draggable floating AI assistant bubble with pulse animation and badge

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { ICON_SIZES } from '@/constants/design-tokens';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_MARGIN, FAB_LEFT_MARGIN, FAB_Z_INDEX } from '@/components/ui/FloatingGlassTabBar';
import { GlassButton } from '@/components/ui/GlassButton';

import { TAB_BAR_HEIGHT, MIN_BUBBLE_TOP_OFFSET } from './deal-assistant-types';
import { styles } from './deal-assistant-styles';

interface AssistantBubbleProps {
  isOpen: boolean;
  pendingCount: number;
  onToggle: () => void;
}

export function AssistantBubble({ isOpen, pendingCount, onToggle }: AssistantBubbleProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { buttonBottom } = useTabBarPadding();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubblePosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Store insets in ref for PanResponder access
  const insetsRef = useRef(insets);
  insetsRef.current = insets;

  // Pulse animation for bubble
  // Note: useNativeDriver must be false because scaleAnim shares a transform
  // with bubblePosition, which requires JS driver for PanResponder
  useEffect(() => {
    if (!isOpen && pendingCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (!isOpen) {
      // Single pulse on mount
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pendingCount, scaleAnim]);

  // Pan responder for draggable bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: Animated.event(
        [null, { dx: bubblePosition.x, dy: bubblePosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        const screen = Dimensions.get('window');
        const currentInsets = insetsRef.current;

        // Snap X to edges with margin + safe area
        const leftSnapX = -(screen.width - FAB_SIZE - FAB_LEFT_MARGIN - currentInsets.right);
        const rightSnapX = 0; // Default position (right edge)
        const snapX = gestureState.moveX > screen.width / 2 ? rightSnapX : leftSnapX;

        // Clamp Y within safe bounds
        const minY = -(screen.height - FAB_BOTTOM_OFFSET - MIN_BUBBLE_TOP_OFFSET - currentInsets.top);
        const maxY = FAB_BOTTOM_OFFSET - TAB_BAR_HEIGHT - currentInsets.bottom;
        const clampedY = Math.max(minY, Math.min(gestureState.dy, maxY));

        Animated.spring(bubblePosition, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: buttonBottom + FAB_BOTTOM_OFFSET,  // Dynamic: adapts to device safe area
          right: FAB_RIGHT_MARGIN,
          zIndex: FAB_Z_INDEX.ASSISTANT,
        },
        {
          transform: [
            { translateX: bubblePosition.x },
            { translateY: bubblePosition.y },
            { scale: scaleAnim },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <GlassButton
        icon={<Sparkles size={ICON_SIZES.xl} color="white" />}
        onPress={onToggle}
        size={FAB_SIZE}
        effect="regular"
        accessibilityLabel="Open AI Assistant"
      />
      {/* Badge - positioned outside GlassButton */}
      {pendingCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{pendingCount}</Text>
        </View>
      )}
    </Animated.View>
  );
}
