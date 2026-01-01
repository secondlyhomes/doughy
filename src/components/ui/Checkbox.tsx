// src/components/ui/Checkbox.tsx
// React Native Checkbox component with NativeWind styling
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  testID?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled,
  label,
  className,
  testID,
}: CheckboxProps) {
  return (
    <TouchableOpacity
      className={cn('flex-row items-center', className)}
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded border-2',
          checked ? 'border-primary bg-primary' : 'border-input bg-background',
          disabled && 'opacity-50'
        )}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>
      {label && (
        <Text
          className={cn(
            'ml-2 text-sm text-foreground',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
