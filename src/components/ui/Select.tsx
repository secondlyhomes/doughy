// src/components/ui/Select.tsx
// React Native Select/Picker component with NativeWind styling
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewProps,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends ViewProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled,
  error,
  label,
  className,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: SelectOption) => {
    if (!option.disabled) {
      onValueChange?.(option.value);
      setIsOpen(false);
    }
  };

  return (
    <View className={cn('w-full', className)} {...props}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-foreground">
          {label}
        </Text>
      )}

      {/* Trigger */}
      <TouchableOpacity
        className={cn(
          'h-10 w-full flex-row items-center justify-between rounded-md border border-input bg-background px-3',
          disabled && 'opacity-50',
          error && 'border-destructive'
        )}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          className={cn(
            'text-sm',
            selectedOption ? 'text-foreground' : 'text-muted-foreground'
          )}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={16} color="#64748b" />
      </TouchableOpacity>

      {error && (
        <Text className="mt-1 text-sm text-destructive">{error}</Text>
      )}

      {/* Options Modal */}
      <Modal
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          className="flex-1 items-center justify-center bg-black/50 px-4"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="w-full max-w-sm rounded-lg border border-border bg-popover shadow-lg">
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={cn(
                    'flex-row items-center px-4 py-3',
                    item.disabled && 'opacity-50',
                    item.value === value && 'bg-accent'
                  )}
                  onPress={() => handleSelect(item)}
                  disabled={item.disabled}
                >
                  <View className="mr-2 h-4 w-4 items-center justify-center">
                    {item.value === value && (
                      <Check size={16} color="#2563eb" />
                    )}
                  </View>
                  <Text
                    className={cn(
                      'text-sm',
                      item.value === value
                        ? 'text-accent-foreground font-medium'
                        : 'text-popover-foreground'
                    )}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
