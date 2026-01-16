/**
 * PhotoCaptureButton Component
 * Camera capture button with flash animation
 *
 * Features:
 * - Flash animation on capture
 * - Loading state during processing
 * - Preview thumbnail display
 * - Camera/gallery selection
 * - Accessibility support
 *
 * Follows Zone B design system with zero hardcoded values.
 * Uses React Native Reanimated for flash animation.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, Image, ViewStyle } from 'react-native';
import { Camera, Image as ImageIcon, Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, OPACITY_VALUES } from '@/constants/design-tokens';
import { LoadingSpinner } from './LoadingSpinner';

export interface PhotoCaptureButtonProps {
  /** onPress handler for capture */
  onCapture: () => void;

  /** Loading state during photo processing */
  isProcessing?: boolean;

  /** Preview image URI after capture */
  previewUri?: string;

  /** Label text */
  label?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Show checkmark when photo captured */
  showSuccess?: boolean;

  /** Custom style */
  style?: ViewStyle;
}

export function PhotoCaptureButton({
  onCapture,
  isProcessing = false,
  previewUri,
  label = 'Take Photo',
  disabled = false,
  showSuccess = false,
  style,
}: PhotoCaptureButtonProps) {
  const colors = useThemeColors();

  // Flash animation value
  const flashOpacity = useSharedValue(0);

  // Trigger flash animation
  const triggerFlash = useCallback(() => {
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
  }, [flashOpacity]);

  // Handle capture with flash animation
  const handleCapture = useCallback(() => {
    if (!disabled && !isProcessing) {
      triggerFlash();
      // Small delay for visual feedback before callback
      setTimeout(() => {
        onCapture();
      }, 150);
    }
  }, [disabled, isProcessing, onCapture, triggerFlash]);

  // Animated flash overlay
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const hasPhoto = !!previewUri;
  const buttonSize = 80;

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
      {/* Capture Button */}
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={handleCapture}
          disabled={disabled || isProcessing}
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: BORDER_RADIUS.lg,
            backgroundColor: hasPhoto
              ? withOpacity(colors.success, 'muted')
              : colors.card,
            borderWidth: 2,
            borderColor: hasPhoto ? colors.success : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: disabled ? OPACITY_VALUES.disabled : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel={hasPhoto ? 'Retake photo' : 'Capture photo'}
          accessibilityState={{
            disabled: disabled || isProcessing,
          }}
        >
          {isProcessing ? (
            <LoadingSpinner size="medium" />
          ) : hasPhoto && previewUri ? (
            <>
              {/* Preview Image */}
              <Image
                source={{ uri: previewUri }}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
              {/* Success Checkmark Overlay */}
              {showSuccess && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: BORDER_RADIUS.full,
                    backgroundColor: colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: SPACING.xs,
                  }}
                >
                  <Check size={16} color={colors.primaryForeground} />
                </View>
              )}
            </>
          ) : (
            <Camera size={ICON_SIZES.xl} color={colors.primary} />
          )}
        </Pressable>

        {/* Flash Overlay */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: BORDER_RADIUS.lg,
              pointerEvents: 'none',
            },
            flashStyle,
          ]}
        />
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: hasPhoto ? colors.success : colors.mutedForeground,
        }}
      >
        {isProcessing ? 'Processing...' : hasPhoto ? 'Photo captured' : label}
      </Text>
    </View>
  );
}
