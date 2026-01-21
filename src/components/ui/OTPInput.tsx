// src/components/ui/OTPInput.tsx
// Fixed-length code input with individual boxes
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

export interface OTPInputProps extends ViewProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  masked?: boolean;
  className?: string;
}

export function OTPInput({
  value = '',
  onChange,
  length = 6,
  disabled = false,
  error,
  autoFocus = false,
  masked = false,
  className,
  ...props
}: OTPInputProps) {
  const [focused, setFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Split value into array of characters
  const digits = value.split('').slice(0, length);

  // Handle text change from hidden input
  const handleChange = useCallback(
    (text: string) => {
      // Only allow digits
      const cleanText = text.replace(/[^0-9]/g, '').slice(0, length);
      onChange?.(cleanText);
      setFocusedIndex(Math.min(cleanText.length, length - 1));
    },
    [length, onChange]
  );

  // Handle backspace
  const handleKeyPress = useCallback(
    ({ nativeEvent }: { nativeEvent: { key: string } }) => {
      if (nativeEvent.key === 'Backspace' && value.length > 0) {
        setFocusedIndex(Math.max(0, value.length - 1));
      }
    },
    [value.length]
  );

  // Focus the hidden input when container is pressed
  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Update focused index when value changes
  useEffect(() => {
    setFocusedIndex(Math.min(value.length, length - 1));
  }, [value, length]);

  const colors = useThemeColors();

  const getBoxBorderColor = (isCurrentFocus: boolean, isFilled: boolean) => {
    if (error) return colors.destructive;
    if (isCurrentFocus) return colors.primary;
    if (isFilled) return `${colors.primary}80`;
    return colors.input;
  };

  return (
    <View className={cn('w-full', className)} {...props}>
      {/* Hidden TextInput for handling actual input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        editable={!disabled}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
        }}
        caretHidden
      />

      {/* Visual boxes */}
      <TouchableOpacity
        onPress={handleContainerPress}
        disabled={disabled}
        activeOpacity={1}
        className="flex-row justify-center gap-2"
        accessibilityLabel={`${length}-digit verification code input. ${value.length} of ${length} digits entered.`}
        accessibilityHint="Tap to enter code"
      >
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index];
          const isCurrentFocus = focused && index === focusedIndex;
          const isFilled = digit !== undefined;

          return (
            <View
              key={index}
              className={cn(
                'h-14 w-12 items-center justify-center rounded-md',
                disabled && 'opacity-50'
              )}
              style={{
                borderWidth: 2,
                borderColor: getBoxBorderColor(isCurrentFocus, isFilled),
                backgroundColor: isFilled && !error ? `${colors.primary}0D` : undefined,
              }}
            >
              <Text
                className="text-2xl font-semibold"
                style={{ color: isFilled ? colors.foreground : colors.mutedForeground }}
              >
                {digit ? (masked ? '•' : digit) : ''}
              </Text>

              {/* Cursor indicator */}
              {isCurrentFocus && !isFilled && (
                <View className="absolute h-6 w-0.5 animate-pulse" style={{ backgroundColor: colors.primary }} />
              )}
            </View>
          );
        })}
      </TouchableOpacity>

      {/* Error message */}
      {error && (
        <Text className="mt-2 text-center text-sm" style={{ color: colors.destructive }}>{error}</Text>
      )}

      {/* Helper text */}
      <Text className="mt-2 text-center text-xs" style={{ color: colors.mutedForeground }}>
        Enter {length}-digit code
      </Text>
    </View>
  );
}
