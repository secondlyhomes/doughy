/**
 * Button Style Utilities
 */

import { ViewStyle, TextStyle } from 'react-native';
import { ButtonVariant, ButtonSize } from './types';

/**
 * Get container styles based on variant, size, and state
 */
export function getContainerStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  theme: any
): ViewStyle {
  const baseStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.tokens.borderRadius.md,
    ...theme.tokens.shadows.sm,
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: {
      height: 36,
      paddingHorizontal: theme.tokens.spacing[3],
    },
    md: {
      height: theme.tokens.sizing.button.md,
      paddingHorizontal: theme.tokens.spacing[4],
    },
    lg: {
      height: theme.tokens.sizing.button.lg,
      paddingHorizontal: theme.tokens.spacing[6],
    },
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary[500],
    },
    secondary: {
      backgroundColor: theme.colors.transparent,
      borderWidth: theme.tokens.borderWidth[1],
      borderColor: theme.colors.primary[500],
    },
    text: {
      backgroundColor: theme.colors.transparent,
      shadowOpacity: 0,
      elevation: 0,
    },
  };

  const disabledStyle: ViewStyle = disabled
    ? { opacity: theme.tokens.opacity[50] }
    : {};

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...disabledStyle,
  };
}

/**
 * Get text styles based on variant, size, and state
 */
export function getTextStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  _disabled: boolean,
  theme: any
): TextStyle {
  const sizeStyles: Record<ButtonSize, TextStyle> = {
    sm: { fontSize: theme.tokens.fontSize.sm },
    md: { fontSize: theme.tokens.fontSize.base },
    lg: { fontSize: theme.tokens.fontSize.lg },
  };

  const variantStyles: Record<ButtonVariant, TextStyle> = {
    primary: {
      color: theme.colors.text.inverse,
      fontWeight: theme.tokens.fontWeight.semibold,
    },
    secondary: {
      color: theme.colors.primary[500],
      fontWeight: theme.tokens.fontWeight.semibold,
    },
    text: {
      color: theme.colors.primary[500],
      fontWeight: theme.tokens.fontWeight.medium,
    },
  };

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
}
