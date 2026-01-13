// src/components/ui/AlertDialog.tsx
// Confirmation dialog that cannot be dismissed by tapping outside
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewProps,
  TextProps,
} from 'react-native';
import { cn } from '@/lib/utils';

// AlertDialog Root
export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <RNModal
      visible={open}
      onRequestClose={() => onOpenChange(false)}
      transparent
      animationType="fade"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* No backdrop press handler - intentionally blocks outside taps */}
        <View className="flex-1 items-center justify-center bg-black/80 px-4">
          <TouchableWithoutFeedback>
            <View>{children}</View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// AlertDialog Content
export interface AlertDialogContentProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDialogContent({
  className,
  children,
  ...props
}: AlertDialogContentProps) {
  return (
    <View
      className={cn(
        'w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// AlertDialog Header
export interface AlertDialogHeaderProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDialogHeader({
  className,
  children,
  ...props
}: AlertDialogHeaderProps) {
  return (
    <View className={cn('flex-col gap-2', className)} {...props}>
      {children}
    </View>
  );
}

// AlertDialog Footer
export interface AlertDialogFooterProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDialogFooter({
  className,
  children,
  ...props
}: AlertDialogFooterProps) {
  return (
    <View
      className={cn('flex-row justify-end gap-2 pt-4', className)}
      {...props}
    >
      {children}
    </View>
  );
}

// AlertDialog Title
export interface AlertDialogTitleProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDialogTitle({
  className,
  children,
  ...props
}: AlertDialogTitleProps) {
  return (
    <Text
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

// AlertDialog Description
export interface AlertDialogDescriptionProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDialogDescription({
  className,
  children,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </Text>
  );
}

// AlertDialog Action Button
export interface AlertDialogActionProps {
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export function AlertDialogAction({
  onPress,
  disabled,
  className,
  textClassName,
  children,
}: AlertDialogActionProps) {
  return (
    <TouchableOpacity
      className={cn(
        'h-10 items-center justify-center rounded-md bg-destructive px-4',
        disabled && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text className={cn('text-sm font-medium text-destructive-foreground', textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// AlertDialog Cancel Button
export interface AlertDialogCancelProps {
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export function AlertDialogCancel({
  onPress,
  disabled,
  className,
  textClassName,
  children,
}: AlertDialogCancelProps) {
  return (
    <TouchableOpacity
      className={cn(
        'h-10 items-center justify-center rounded-md border border-input bg-background px-4',
        disabled && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text className={cn('text-sm font-medium text-foreground', textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
