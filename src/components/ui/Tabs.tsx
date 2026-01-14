// src/components/ui/Tabs.tsx
// React Native Tabs component with NativeWind styling
import React, { createContext, useContext, useState } from 'react';
import { View, Text, Pressable, ViewProps, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

// Tabs context
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// Tabs Root
export interface TabsProps extends ViewProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <View className={cn('w-full', className)} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
}

// Tabs List
export interface TabsListProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <View
      className={cn(
        'flex-row h-10 items-center justify-start bg-muted rounded-md p-1',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// Tabs Trigger
export interface TabsTriggerProps {
  value: string;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function TabsTrigger({
  value,
  className,
  textClassName,
  disabled,
  children,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = value === selectedValue;

  return (
    <Pressable
      className={cn(
        'flex-1 items-center justify-center rounded-sm px-3 py-1.5',
        isActive && 'bg-background shadow-sm',
        disabled && 'opacity-50',
        className
      )}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'text-sm font-medium',
            isActive ? 'text-foreground' : 'text-muted-foreground',
            textClassName
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// Tabs Content
export interface TabsContentProps extends ViewProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();

  if (value !== selectedValue) {
    return null;
  }

  return (
    <View className={cn('mt-2', className)} {...props}>
      {children}
    </View>
  );
}
