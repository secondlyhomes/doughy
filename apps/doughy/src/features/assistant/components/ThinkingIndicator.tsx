// src/features/assistant/components/ThinkingIndicator.tsx
// Animated thinking dots indicator for AI assistant loading state

import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

export function ThinkingIndicator() {
  const colors = useThemeColors();
  const dots = [1, 2, 3];
  const animations = useRef(dots.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animateDots = () => {
      const staggeredAnimations = animations.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      );
      Animated.parallel(staggeredAnimations).start();
    };

    animateDots();

    return () => {
      animations.forEach((anim) => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.thinkingDots}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: colors.primary },
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thinkingDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dot: {
    width: BORDER_RADIUS.sm,
    height: BORDER_RADIUS.sm,
    borderRadius: 3,
  },
});
