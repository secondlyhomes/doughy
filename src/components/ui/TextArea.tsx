// src/components/ui/TextArea.tsx
// React Native TextArea component with NativeWind styling
import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

export interface TextAreaProps extends TextInputProps {
  className?: string;
  error?: string;
  label?: string;
}

export function TextArea({
  className,
  error,
  label,
  editable = true,
  numberOfLines = 4,
  style,
  ...props
}: TextAreaProps) {
  const colors = useThemeColors();
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.foreground }}>
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'min-h-[80px] w-full rounded-md px-3 py-2 text-base',
          !editable && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.input,
            color: colors.foreground,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{error}</Text>
      )}
    </View>
  );
}
