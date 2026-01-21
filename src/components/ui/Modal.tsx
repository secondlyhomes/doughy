// src/components/ui/Modal.tsx
// React Native Modal/Dialog component with NativeWind styling and glass effects
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
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { GlassBackdrop } from './GlassView';

// Modal Root
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  /** Use glass blur effect for backdrop. Default: true */
  useGlassBackdrop?: boolean;
}

export function Modal({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  animationType = 'fade',
  useGlassBackdrop = true,
}: ModalProps) {
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: false,
    hasNavigationHeader: false,
  });

  const renderBackdrop = () => {
    if (useGlassBackdrop) {
      return (
        <GlassBackdrop
          intensity={30}
          style={styles.backdrop}
        >
          <TouchableWithoutFeedback
            onPress={closeOnBackdropPress ? onClose : undefined}
          >
            <View style={styles.backdropTouchable}>
              <TouchableWithoutFeedback>
                <View>{children}</View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </GlassBackdrop>
      );
    }

    // Fallback to original solid backdrop
    return (
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <View className="flex-1 items-center justify-center bg-black/80 px-4">
          <TouchableWithoutFeedback>
            <View>{children}</View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <RNModal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType={animationType}
    >
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        style={styles.container}
      >
        {renderBackdrop()}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  backdropTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});

// Modal Content
export interface ModalContentProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function ModalContent({
  className,
  children,
  showCloseButton = true,
  onClose,
  ...props
}: ModalContentProps) {
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
      {showCloseButton && onClose && (
        <TouchableOpacity
          className="absolute right-4 top-4 rounded-sm opacity-70"
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        >
          <X size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Modal Header
export interface ModalHeaderProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function ModalHeader({ className, children, ...props }: ModalHeaderProps) {
  return (
    <View className={cn('flex-col gap-1.5', className)} {...props}>
      {children}
    </View>
  );
}

// Modal Footer
export interface ModalFooterProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function ModalFooter({ className, children, ...props }: ModalFooterProps) {
  return (
    <View
      className={cn('flex-row justify-end gap-2 pt-4', className)}
      {...props}
    >
      {children}
    </View>
  );
}

// Modal Title
export interface ModalTitleProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function ModalTitle({ className, children, style, ...props }: ModalTitleProps) {
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

// Modal Description
export interface ModalDescriptionProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function ModalDescription({
  className,
  children,
  style,
  ...props
}: ModalDescriptionProps) {
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

// Aliases for Dialog naming convention
export const Dialog = Modal;
export const DialogContent = ModalContent;
export const DialogHeader = ModalHeader;
export const DialogFooter = ModalFooter;
export const DialogTitle = ModalTitle;
export const DialogDescription = ModalDescription;
