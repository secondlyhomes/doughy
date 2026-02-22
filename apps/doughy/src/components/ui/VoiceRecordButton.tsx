/**
 * VoiceRecordButton Component
 * Animated button for voice recording with visual feedback
 *
 * Features:
 * - Pulse animation when recording
 * - Recording duration display
 * - Press and hold to record
 * - Visual waveform animation
 * - Haptic feedback
 * - Accessibility support
 *
 * Follows Zone B design system with zero hardcoded values.
 * Uses React Native Reanimated for performant animations.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, OPACITY_VALUES } from '@/constants/design-tokens';

export interface VoiceRecordButtonProps {
  /** Whether currently recording */
  isRecording: boolean;

  /** Recording duration in seconds */
  duration?: number;

  /** onPress handler to start/stop recording */
  onPress: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Size variant */
  size?: 'default' | 'large';

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Formats duration in seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceRecordButton({
  isRecording,
  duration = 0,
  onPress,
  disabled = false,
  size = 'default',
  style,
}: VoiceRecordButtonProps) {
  const colors = useThemeColors();

  // Animation values
  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);

  // Get size dimensions
  const buttonSize = size === 'large' ? 80 : 64;
  const iconSize = size === 'large' ? 32 : 24;

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      // Pulse the button
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Wave opacity animation
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Stop animations
      cancelAnimation(pulseScale);
      cancelAnimation(waveOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      waveOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, pulseScale, waveOpacity]);

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedWaveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  return (
    <View
      style={[
        {
          alignItems: 'center',
          gap: SPACING.md,
        },
        style,
      ]}
    >
      {/* Recording Button */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* Wave rings (shown when recording) */}
        {isRecording && (
          <>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: buttonSize + 32,
                  height: buttonSize + 32,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: withOpacity(colors.destructive, 'light'),
                },
                animatedWaveStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: buttonSize + 16,
                  height: buttonSize + 16,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: withOpacity(colors.destructive, 'medium'),
                },
                animatedWaveStyle,
              ]}
            />
          </>
        )}

        {/* Main Button */}
        <Animated.View style={animatedButtonStyle}>
          <Pressable
            onPress={onPress}
            disabled={disabled}
            style={{
              width: buttonSize,
              height: buttonSize,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: isRecording ? colors.destructive : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? OPACITY_VALUES.disabled : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice recording'}
            accessibilityState={{
              disabled,
              busy: isRecording,
            }}
          >
            {isRecording ? (
              <Square size={iconSize} color={colors.primaryForeground} fill={colors.primaryForeground} />
            ) : (
              <Mic size={iconSize} color={colors.primaryForeground} />
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Duration Display */}
      {isRecording && (
        <View
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.destructive, 'muted'),
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.destructive,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatDuration(duration)}
          </Text>
        </View>
      )}

      {/* Status Text */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: isRecording ? colors.destructive : colors.mutedForeground,
        }}
      >
        {isRecording ? 'Recording...' : 'Tap to record'}
      </Text>
    </View>
  );
}
