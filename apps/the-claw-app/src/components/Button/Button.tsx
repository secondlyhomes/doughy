/**
 * Button Component
 *
 * Simple, accessible button component with variants and sizes
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button title="Submit" onPress={() => console.log('pressed')} />
 *
 * // Secondary button
 * <Button title="Cancel" variant="secondary" onPress={handleCancel} />
 *
 * // Loading state
 * <Button title="Loading..." loading />
 * ```
 */

import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { Text } from '../Text';
import { ButtonProps } from './types';
import { getContainerStyles, getTextStyles } from './styles';

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  hapticFeedback = true,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  function handlePress() {
    if (isDisabled || !onPress) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  }

  const containerStyle: ViewStyle = {
    ...getContainerStyles(variant, size, isDisabled, theme),
    ...style,
  };

  const buttonTextStyle: TextStyle = {
    ...getTextStyles(variant, size, isDisabled, theme),
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary'
              ? theme.colors.text.inverse
              : theme.colors.primary[500]
          }
        />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
