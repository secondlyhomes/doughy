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
  ...props
}: InputProps) {
  const colors = useThemeColors();
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-foreground">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground',
          'placeholder:text-muted-foreground',
          !editable && 'opacity-50',
          error && 'border-destructive',
          className
        )}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
}
