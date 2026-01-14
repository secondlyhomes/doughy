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
  multiline?: boolean;
}

export function Input({
  className,
  error,
  label,
  editable = true,
  multiline = false,
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
          'h-10 w-full rounded-lg px-3 text-base',
          !editable && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.background,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.input,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop: multiline ? 8 : 10,
            paddingBottom: multiline ? 8 : 10,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        multiline={multiline}
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
