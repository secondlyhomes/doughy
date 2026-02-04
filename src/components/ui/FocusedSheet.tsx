// src/components/ui/FocusedSheet.tsx
// iOS Page Sheet modal for focused forms (5+ fields, complex calculations)
// Uses native iOS presentationStyle="pageSheet" for swipe-down dismiss and reduced distraction

import React, { useCallback } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';

export interface FocusedSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet title displayed in header */
  title: string;
  /** Optional subtitle displayed below title */
  subtitle?: string;
  /** Sheet content */
  children?: React.ReactNode;
  /** Text for done/submit button. If not provided, only close button shown */
  doneLabel?: string;
  /** Callback when done button pressed */
  onDone?: () => void;
  /** Whether done button is disabled */
  doneDisabled?: boolean;
  /** Whether form is currently submitting (shows loading state) */
  isSubmitting?: boolean;
  /** Text for cancel button. Defaults to "Cancel" */
  cancelLabel?: string;
  /** Whether content should be wrapped in ScrollView. Default: true */
  scrollable?: boolean;
  /** Optional progress indicator (0-1) for multi-step flows */
  progress?: number;
  /** Optional step text like "Step 1 of 4" */
  stepText?: string;
}

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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              {cancelLabel}
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Done Button or Close */}
          {doneLabel && onDone ? (
            <TouchableOpacity
              onPress={handleDone}
              style={styles.headerButton}
              disabled={doneDisabled || isSubmitting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={doneLabel}
              accessibilityState={{ disabled: doneDisabled || isSubmitting }}
            >
              <Text
                style={[
                  styles.doneText,
                  {
                    color: doneDisabled || isSubmitting
                      ? colors.mutedForeground
                      : colors.primary,
                  },
                ]}
              >
                {isSubmitting ? 'Saving...' : doneLabel}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Bar (optional) */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            {stepText && (
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
                {stepText}
              </Text>
            )}
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Content */}
        {renderContent()}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

/**
 * Section component for grouping content within FocusedSheet
 */
export interface FocusedSheetSectionProps {
  title?: string;
  children?: React.ReactNode;
}

export function FocusedSheetSection({ title, children }: FocusedSheetSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

/**
 * Footer component for action buttons at bottom of FocusedSheet
 */
export interface FocusedSheetFooterProps {
  children?: React.ReactNode;
}

export function FocusedSheetFooter({ children }: FocusedSheetFooterProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + SPACING.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
    paddingVertical: SPACING.xs,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZES.base,
  },
  doneText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'right',
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  stepText: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
});

export default FocusedSheet;
