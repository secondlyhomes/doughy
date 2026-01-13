// src/components/ui/RadioGroup.tsx
// React Native RadioGroup component with NativeWind styling
import React, { createContext, useContext } from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

// Radio Group Context
interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | null>(null);

function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup');
  }
  return context;
}

// Radio Group
export interface RadioGroupProps extends ViewProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RadioGroup({
  value = '',
  onValueChange = () => {},
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <View className={cn('gap-2', className)} {...props}>
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

// Radio Group Item
export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function RadioGroupItem({
  value,
  disabled,
  label,
  className,
}: RadioGroupItemProps) {
  const { value: selectedValue, onValueChange } = useRadioGroupContext();
  const isSelected = value === selectedValue;

  return (
    <TouchableOpacity
      className={cn('flex-row items-center', className)}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      accessibilityLabel={label}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border-2',
          isSelected ? 'border-primary' : 'border-input',
          disabled && 'opacity-50'
        )}
      >
        {isSelected && (
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        )}
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
