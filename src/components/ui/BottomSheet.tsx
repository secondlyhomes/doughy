// src/components/ui/BottomSheet.tsx
// React Native Bottom Sheet component with NativeWind styling
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  title?: string;
  maxHeight?: number | 'auto';
}

export function BottomSheet({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  title,
  maxHeight = SCREEN_HEIGHT * 0.7,
}: BottomSheetProps) {
  return (
    <RNModal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback
          onPress={closeOnBackdropPress ? onClose : undefined}
        >
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View
                className="bg-background rounded-t-3xl border-t border-border"
                style={{ maxHeight: maxHeight === 'auto' ? undefined : maxHeight }}
              >
                {/* Handle Bar */}
                <View className="items-center pt-3 pb-2">
                  <View className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </View>

                {/* Header */}
                {title && (
                  <View className="flex-row items-center justify-between px-4 pb-4 border-b border-border">
                    <Text className="text-lg font-semibold text-foreground">
                      {title}
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      className="p-2 -mr-2 rounded-full"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Content */}
                <ScrollView
                  className="px-4"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  {children}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// Bottom Sheet Section component for grouping content
export interface BottomSheetSectionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function BottomSheetSection({
  title,
  children,
  className,
}: BottomSheetSectionProps) {
  return (
    <View className={cn('py-4', className)}>
      {title && (
        <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
