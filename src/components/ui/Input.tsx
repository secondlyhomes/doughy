// src/components/ui/Input.tsx
// React Native Input component with NativeWind styling
import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

export interface InputProps extends TextInputProps {
  className?: string;
  error?: string;
  label?: string;
}

export function Input({
  className,
  error,
  label,
  editable = true,
  style,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  return (
    <View className="w-full">
      {label && (
        <Text
          className="mb-1.5 text-sm font-medium"
          style={{ color: colors.foreground }}
        >
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'h-10 w-full rounded-md px-3 py-2 text-base',
          !editable && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.background,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.input,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>
          {error}
        </Text>
      )}
    </View>
  );
}
