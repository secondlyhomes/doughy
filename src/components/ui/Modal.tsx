// src/components/ui/Modal.tsx
// React Native Modal/Dialog component with NativeWind styling
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
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

// Modal Root
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export function Modal({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  animationType = 'fade',
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType={animationType}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback
          onPress={closeOnBackdropPress ? onClose : undefined}
        >
          <View className="flex-1 items-center justify-center bg-black/80 px-4">
            <TouchableWithoutFeedback>
              <View>{children}</View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

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
  return (
    <View
      className={cn(
        'w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && onClose && (
        <TouchableOpacity
          className="absolute right-4 top-4 rounded-sm opacity-70"
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#64748b" />
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

export function ModalTitle({ className, children, ...props }: ModalTitleProps) {
  return (
    <Text
      className={cn('text-lg font-semibold text-foreground', className)}
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
  ...props
}: ModalDescriptionProps) {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)} {...props}>
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
