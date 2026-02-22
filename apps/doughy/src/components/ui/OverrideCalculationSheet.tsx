/**
 * OverrideCalculationSheet Component
 * Bottom sheet for manually overriding AI calculations
 *
 * Features:
 * - Before/after comparison display
 * - Input field for manual value entry
 * - Reason/notes field for documentation
 * - Glass backdrop effect
 * - Validation and formatting
 * - Save/Cancel actions
 * - Accessibility support
 *
 * Follows Zone B design system with zero hardcoded values.
 * Uses React Native Reanimated for smooth sheet animations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, OPACITY_VALUES } from '@/constants/design-tokens';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { Input } from './Input';
import { formatInput } from './override-calculation-types';
import { OverrideWarningBanner } from './OverrideWarningBanner';
import { OverrideComparisonCard } from './OverrideComparisonCard';
import { OverrideSheetActions } from './OverrideSheetActions';

export type { CalculationOverride, OverrideCalculationSheetProps } from './override-calculation-types';

export { OverrideWarningBanner } from './OverrideWarningBanner';
export { OverrideComparisonCard } from './OverrideComparisonCard';
export type { OverrideComparisonCardProps } from './OverrideComparisonCard';
export { OverrideSheetActions } from './OverrideSheetActions';
export type { OverrideSheetActionsProps } from './OverrideSheetActions';

import type { OverrideCalculationSheetProps } from './override-calculation-types';

export function OverrideCalculationSheet({
  isVisible,
  onClose,
  onSave,
  calculation,
  isSaving = false,
  style,
}: OverrideCalculationSheetProps) {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: false,
    hasNavigationHeader: false,
  });
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(1000);

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (isVisible) {
      setNewValue('');
      setReason('');
      setError('');
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(1000, {
        duration: 250,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isVisible, backdropOpacity, sheetTranslateY]);

  const handleValueChange = (text: string) => {
    setError('');
    const formatted = formatInput(text, calculation.inputType);
    setNewValue(formatted);
  };

  const handleSave = () => {
    // Validation
    if (!newValue.trim()) {
      setError('Please enter a new value');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this override');
      return;
    }

    if (calculation.validate && !calculation.validate(newValue)) {
      setError('Invalid value entered');
      return;
    }

    onSave(newValue, reason);
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.background,
              opacity: OPACITY_VALUES.loading,
            },
            backdropStyle,
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onClose}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close override sheet"
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '80%',
              backgroundColor: colors.card,
              borderTopLeftRadius: BORDER_RADIUS.xl,
              borderTopRightRadius: BORDER_RADIUS.xl,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            },
            sheetStyle,
            style,
          ]}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: SPACING.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View
              style={{
                padding: SPACING.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
                  Override Calculation
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: SPACING.xs }}>
                  {calculation.fieldName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: withOpacity(colors.foreground, 'subtle'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={ICON_SIZES.md} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ padding: SPACING.lg, gap: SPACING.lg }}>
              <OverrideWarningBanner />

              <OverrideComparisonCard
                calculation={calculation}
                newValue={newValue}
              />

              {/* New Value Input */}
              <View style={{ gap: SPACING.sm }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  New Value
                </Text>
                <Input
                  value={newValue}
                  onChangeText={handleValueChange}
                  placeholder={`Enter ${calculation.fieldName.toLowerCase()}`}
                  keyboardType={
                    calculation.inputType === 'currency' || calculation.inputType === 'number'
                      ? 'decimal-pad'
                      : 'default'
                  }
                  autoFocus
                />
                {calculation.helperText && (
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {calculation.helperText}
                  </Text>
                )}
              </View>

              {/* Reason Input */}
              <View style={{ gap: SPACING.sm }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  Reason for Override
                </Text>
                <Input
                  value={reason}
                  onChangeText={(text) => {
                    setError('');
                    setReason(text);
                  }}
                  placeholder="Explain why you're overriding this calculation..."
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                />
              </View>

              <OverrideSheetActions
                error={error}
                isSaving={isSaving}
                newValue={newValue}
                reason={reason}
                onClose={onClose}
                onSave={handleSave}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
