// src/components/ui/Button.tsx
// React Native Button component with inline styles for dark mode support
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  variant = 'default',
  size = 'default',
  onPress,
  disabled,
  loading,
  children,
  className,
  textClassName,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'default':
        return colors.primary;
      case 'destructive':
        return colors.destructive;
      case 'outline':
        return colors.background;
      case 'secondary':
        return colors.secondary;
      case 'ghost':
      case 'link':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'outline':
        return colors.input;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'default':
        return colors.primaryForeground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'outline':
      case 'ghost':
        return colors.foreground;
      case 'secondary':
        return colors.mutedForeground;
      case 'link':
        return colors.primary;
      default:
        return colors.primaryForeground;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'icon':
        return styles.sizeIcon;
      default:
        return styles.sizeDefault;
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'default') return colors.primaryForeground;
    if (variant === 'destructive') return colors.destructiveForeground;
    return colors.foreground;
  };

  return (
    <TouchableOpacity
      className={cn('flex-row items-center justify-center gap-2 rounded-lg', className)}
      style={[
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: getBorderColor(),
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : typeof children === 'string' ? (
        <Text
          className={cn('text-sm font-medium', textClassName)}
          style={[
            { color: getTextColor() },
            variant === 'link' && styles.linkText,
          ]}
        >
          {children}
        </Text>
      ) : (
        React.Children.map(children, (child) =>
          typeof child === 'string' ? (
            <Text
              className={cn('text-sm font-medium', textClassName)}
              style={[
                { color: getTextColor() },
                variant === 'link' && styles.linkText,
              ]}
            >
              {child}
            </Text>
          ) : (
            child
          )
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sizeDefault: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: 12,
  },
  sizeLg: {
    height: 44,
    paddingHorizontal: 32,
  },
  sizeIcon: {
    height: 40,
    width: 40,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});

export { Button as default };
