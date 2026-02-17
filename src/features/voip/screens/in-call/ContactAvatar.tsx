// src/features/voip/screens/in-call/ContactAvatar.tsx
// Animated avatar component for call screen

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from './styles';

interface ContactAvatarProps {
  name: string;
  isConnected: boolean;
}

export function ContactAvatar({ name, isConnected }: ContactAvatarProps) {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isConnected) {
      // Pulse animation when connected
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      // Ring animation when not connected
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
      pulseAnim.setValue(1);
      ringAnim.setValue(0.5);
    };
  }, [isConnected, pulseAnim, ringAnim]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarContainer}>
      {/* Ring effect */}
      {!isConnected && (
        <Animated.View
          style={[
            styles.avatarRing,
            {
              borderColor: colors.primary,
              opacity: ringAnim,
              transform: [{ scale: ringAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [1, 1.3],
              }) }],
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {initials ? (
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
        ) : (
          <User size={40} color={colors.primaryForeground} />
        )}
      </Animated.View>
    </View>
  );
}
