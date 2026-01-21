// src/components/ui/Input.tsx
// React Native Input component with NativeWind styling
import React, { useState, useCallback, forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text, LayoutChangeEvent } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';

export interface InputProps extends TextInputProps {
  className?: string;
  error?: string;
  label?: string;
  multiline?: boolean;
  /** Accessibility hint describing what will happen when the user interacts */
  accessibilityHint?: string;
  /** Handler for layout events (used for scroll-to-error) */
  onLayoutContainer?: (event: LayoutChangeEvent) => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    className,
    error,
    label,
    editable = true,
    multiline = false,
    style,
    onFocus,
    onBlur,
    accessibilityHint,
    accessibilityLabel,
    onLayoutContainer,
    ...props
  },
  ref
) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return colors.destructive;
    if (isFocused) return colors.primary;
    return colors.input;
  };

  return (
    <View className="w-full" onLayout={onLayoutContainer}>
      {label && (
        <Text
          className="mb-1.5 font-medium"
          style={{
            color: colors.foreground,
            fontSize: FONT_SIZES.sm,
            lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg px-3',
          !editable && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.background,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: getBorderColor(),
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop: multiline ? 8 : 10,
            paddingBottom: multiline ? 8 : 10,
            fontSize: FONT_SIZES.base,
            lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        {...props}
      />
      {error && (
        <Text
          className="mt-1"
          style={{
            color: colors.destructive,
            fontSize: FONT_SIZES.sm,
            lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
});
