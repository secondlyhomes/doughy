// src/components/ui/Switch.tsx
// React Native Switch component with NativeWind styling
import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, View, Text } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';

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
  const colors = useThemeColors();
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <RNSwitch
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{
          false: colors.input,
          true: colors.primary,
        }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.input}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled }}
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
