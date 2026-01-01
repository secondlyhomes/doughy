// src/components/ui/Switch.tsx
// React Native Switch component with NativeWind styling
import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <RNSwitch
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{
          false: '#e2e8f0', // input color
          true: '#2563eb', // primary color
        }}
        thumbColor={checked ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="#e2e8f0"
        {...props}
      />
      {label && (
        <Text
          className={cn(
            'text-sm text-foreground',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
