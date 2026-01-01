// src/components/ui/TextArea.tsx
// React Native TextArea component with NativeWind styling
import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

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
  ...props
}: TextAreaProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-foreground">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground',
          'placeholder:text-muted-foreground',
          !editable && 'opacity-50',
          error && 'border-destructive',
          className
        )}
        placeholderTextColor="#64748b"
        editable={editable}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        {...props}
      />
      {error && (
        <Text className="mt-1 text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
}
