// src/components/ui/DropdownMenu.tsx
// Menu with items, icons, and separators
// Uses BottomSheet on mobile for better UX
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
  ViewProps,
  TextProps,
} from 'react-native';
import { cn } from '@/lib/utils';

// Context
interface DropdownMenuContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu provider');
  }
  return context;
}

// Root
export interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function DropdownMenu({
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// Trigger
export interface DropdownMenuTriggerProps {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className,
}: DropdownMenuTriggerProps) {
  const { open, onOpenChange } = useDropdownMenuContext();

  const handlePress = useCallback(() => {
    onOpenChange(!open);
  }, [open, onOpenChange]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: handlePress,
    });
  }

  return (
    <TouchableOpacity
      className={cn(className)}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

// Content - renders as bottom sheet on mobile
export interface DropdownMenuContentProps extends ViewProps {
  align?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
  className?: string;
}

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownMenuContentProps) {
  const { open, onOpenChange } = useDropdownMenuContext();

  if (!open) return null;

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View
              className={cn(
                'rounded-t-xl border-t border-border bg-background pb-8 pt-2',
                className
              )}
              {...props}
            >
              {/* Handle bar */}
              <View className="mb-2 items-center">
                <View className="h-1 w-10 rounded-full bg-muted" />
              </View>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

// Menu Item
export interface DropdownMenuItemProps {
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
  closeOnPress?: boolean;
}

export function DropdownMenuItem({
  onPress,
  disabled = false,
  destructive = false,
  icon,
  children,
  className,
  textClassName,
  closeOnPress = true,
}: DropdownMenuItemProps) {
  const { onOpenChange } = useDropdownMenuContext();

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
    if (closeOnPress) {
      onOpenChange(false);
    }
  }, [disabled, onPress, closeOnPress, onOpenChange]);

  return (
    <TouchableOpacity
      className={cn(
        'flex-row items-center gap-3 px-4 py-3',
        disabled && 'opacity-50',
        className
      )}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <View className={destructive ? 'text-destructive' : ''}>
          {icon}
        </View>
      )}
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'text-base',
            destructive ? 'text-destructive' : 'text-foreground',
            textClassName
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// Separator
export interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <View className={cn('my-1 h-px bg-border', className)} />;
}

// Label
export interface DropdownMenuLabelProps extends TextProps {
  children?: React.ReactNode;
  className?: string;
}

export function DropdownMenuLabel({
  children,
  className,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <Text
      className={cn('px-4 py-2 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

// Group (optional wrapper for grouping items)
export interface DropdownMenuGroupProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function DropdownMenuGroup({
  children,
  className,
  ...props
}: DropdownMenuGroupProps) {
  return (
    <View className={cn(className)} {...props}>
      {children}
    </View>
  );
}
