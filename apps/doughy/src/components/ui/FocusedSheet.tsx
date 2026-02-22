// src/components/ui/FocusedSheet.tsx
// iOS Page Sheet modal for focused forms (5+ fields, complex calculations)
// Uses native iOS presentationStyle="pageSheet" for swipe-down dismiss and reduced distraction

import React, { useCallback } from 'react';
import {
  Modal as RNModal,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';
import { styles } from '@/components/ui/focused-sheet-styles';
import { FocusedSheetHeader } from '@/components/ui/FocusedSheetHeader';
import { FocusedSheetProgressBar } from '@/components/ui/FocusedSheetProgressBar';
import type { FocusedSheetProps } from '@/components/ui/focused-sheet-types';

// Re-export types and sub-components for backwards compatibility
export type { FocusedSheetProps, FocusedSheetSectionProps, FocusedSheetFooterProps } from '@/components/ui/focused-sheet-types';
export { FocusedSheetSection } from '@/components/ui/FocusedSheetSection';
export { FocusedSheetFooter } from '@/components/ui/FocusedSheetFooter';

export function FocusedSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  doneLabel,
  onDone,
  doneDisabled = false,
  isSubmitting = false,
  cancelLabel = 'Cancel',
  scrollable = true,
  progress,
  stepText,
}: FocusedSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleClose = useCallback(() => {
    haptic.light();
    onClose();
  }, [onClose]);

  const handleDone = useCallback(() => {
    if (onDone && !doneDisabled && !isSubmitting) {
      haptic.medium();
      onDone();
    }
  }, [onDone, doneDisabled, isSubmitting]);

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.content, { paddingBottom: insets.bottom + SPACING.lg }]}>
        {children}
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <FocusedSheetHeader
          title={title}
          subtitle={subtitle}
          cancelLabel={cancelLabel}
          doneLabel={doneLabel}
          doneDisabled={doneDisabled}
          isSubmitting={isSubmitting}
          onClose={handleClose}
          onDone={onDone ? handleDone : undefined}
        />

        {progress !== undefined && (
          <FocusedSheetProgressBar progress={progress} stepText={stepText} />
        )}

        {renderContent()}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

export default FocusedSheet;
