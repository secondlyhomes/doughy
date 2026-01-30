// src/components/ui/AlertDialog.tsx
// Confirmation dialog that cannot be dismissed by tapping outside, with glass effects
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ViewProps,
  TextProps,
  StyleSheet,
} from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PRESS_OPACITY } from '@/constants/design-tokens';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { GlassBackdrop } from './GlassView';

// AlertDialog Root
export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  /** Use glass blur effect for backdrop. Default: true */
  useGlassBackdrop?: boolean;
}

export function AlertDialog({ open, onOpenChange, children, useGlassBackdrop = true }: AlertDialogProps) {
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: false,
    hasNavigationHeader: false,
  });

  const renderBackdrop = () => {
    if (useGlassBackdrop) {
      return (
        <GlassBackdrop
          intensity={40}
          style={alertDialogStyles.backdrop}
        >
          {/* No backdrop press handler - intentionally blocks outside taps */}
          <View style={alertDialogStyles.content}>
            <TouchableWithoutFeedback>
              <View>{children}</View>
            </TouchableWithoutFeedback>
          </View>
        </GlassBackdrop>
      );
    }

    // Fallback to original solid backdrop
    return (
      <View className="flex-1 items-center justify-center bg-black/80 px-4">
        <TouchableWithoutFeedback>
          <View>{children}</View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  return (
    <RNModal
      visible={open}
      onRequestClose={() => onOpenChange(false)}
      transparent
      animationType="fade"
    >
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        style={alertDialogStyles.container}
      >
        {renderBackdrop()}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const alertDialogStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});

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
  const colors = useThemeColors();
  return (
    <View
      className={cn('w-full max-w-lg rounded-lg p-6 shadow-lg', className)}
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      }}
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
  style,
  ...props
}: AlertDialogTitleProps) {
  const colors = useThemeColors();
  return (
    <Text
      className={cn('text-lg font-semibold', className)}
      style={[{ color: colors.foreground }, style]}
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
  style,
  ...props
}: AlertDialogDescriptionProps) {
  const colors = useThemeColors();
  return (
    <Text
      className={cn('text-sm', className)}
      style={[{ color: colors.mutedForeground }, style]}
      {...props}
    >
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
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className={cn(
        'h-10 items-center justify-center rounded-md px-4',
        disabled && 'opacity-50',
        className
      )}
      style={{ backgroundColor: colors.destructive }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={PRESS_OPACITY.DEFAULT}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn('text-sm font-medium', textClassName)}
          style={{ color: colors.destructiveForeground }}
        >
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
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className={cn(
        'h-10 items-center justify-center rounded-md px-4',
        disabled && 'opacity-50',
        className
      )}
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.input,
      }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={PRESS_OPACITY.DEFAULT}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn('text-sm font-medium', textClassName)}
          style={{ color: colors.foreground }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
