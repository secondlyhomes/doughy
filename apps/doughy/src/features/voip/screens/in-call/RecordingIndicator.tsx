// src/features/voip/screens/in-call/RecordingIndicator.tsx
// Recording indicator component

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { styles } from './styles';

export function RecordingIndicator() {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
      pulseAnim.setValue(1);
    };
  }, [pulseAnim]);

  return (
    <View style={[styles.recordingContainer, { backgroundColor: withOpacity(colors.destructive, 'light') }]}>
      <Animated.View style={[styles.recordingDot, { backgroundColor: colors.destructive, opacity: pulseAnim }]} />
      <Text style={[styles.recordingText, { color: colors.destructive }]}>Recording</Text>
    </View>
  );
}
