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
  ViewStyle,
} from 'react-native';
import { X, ArrowRight, AlertTriangle } from 'lucide-react-native';
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
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { Badge } from './Badge';

export interface CalculationOverride {
  /** Calculation field name */
  fieldName: string;

  /** Current AI-calculated value */
  aiValue: string;

  /** Unit/suffix (e.g., "$", "%", "sqft") */
  unit?: string;

  /** Input type */
  inputType?: 'currency' | 'percentage' | 'number' | 'text';

  /** Validation function */
  validate?: (value: string) => boolean;

  /** Helper text */
  helperText?: string;
}

export interface OverrideCalculationSheetProps {
  /** Whether sheet is visible */
  isVisible: boolean;

  /** Callback when sheet is closed */
  onClose: () => void;

  /** Callback when override is saved */
  onSave: (newValue: string, reason: string) => void;

  /** Calculation to override */
  calculation: CalculationOverride;

  /** Whether save is in progress */
  isSaving?: boolean;

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Formats input based on type
 */
function formatInput(value: string, type?: 'currency' | 'percentage' | 'number' | 'text'): string {
  if (!type || type === 'text') return value;

  // Remove non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');

  if (type === 'currency') {
    // Format as currency without symbol (will be added in display)
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (type === 'percentage') {
    // Format as percentage without symbol
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  }

  if (type === 'number') {
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  }

  return cleaned;
}

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

  const getDisplayValue = (value: string) => {
    if (!calculation.unit && calculation.inputType !== 'currency' && calculation.inputType !== 'percentage') {
      return value;
    }

    if (calculation.inputType === 'currency') {
      // Parse and format currency value
      const cleaned = value.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      if (isNaN(num)) return value;
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    if (calculation.inputType === 'percentage') {
      return `${value}%`;
    }

    return `${value} ${calculation.unit || ''}`;
  };

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
              {/* Warning Banner */}
              <Card variant="default" style={{ backgroundColor: withOpacity(colors.warning, 'subtle') }}>
                <View
                  style={{
                    padding: SPACING.md,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: SPACING.sm,
                  }}
                >
                  <AlertTriangle size={ICON_SIZES.md} color={colors.warning} />
                  <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                    Overriding AI calculations may affect accuracy. Please provide a detailed reason for
                    this change.
                  </Text>
                </View>
              </Card>

              {/* Before/After Comparison */}
              <View style={{ gap: SPACING.md }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  Value Comparison
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.md,
                  }}
                >
                  {/* AI Value */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: SPACING.xs }}>
                      AI Calculated
                    </Text>
                    <Card variant="default">
                      <View style={{ padding: SPACING.md, alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                          {getDisplayValue(calculation.aiValue)}
                        </Text>
                        <Badge variant="outline" size="sm" style={{ marginTop: SPACING.xs }}>
                          Current
                        </Badge>
                      </View>
                    </Card>
                  </View>

                  {/* Arrow */}
                  <ArrowRight size={ICON_SIZES.lg} color={colors.mutedForeground} />

                  {/* New Value */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: SPACING.xs }}>
                      Your Override
                    </Text>
                    <Card variant="default">
                      <View style={{ padding: SPACING.md, alignItems: 'center' }}>
                        {newValue ? (
                          <>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary }}>
                              {getDisplayValue(newValue)}
                            </Text>
                            <Badge variant="default" size="sm" style={{ marginTop: SPACING.xs }}>
                              New
                            </Badge>
                          </>
                        ) : (
                          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Enter value</Text>
                        )}
                      </View>
                    </Card>
                  </View>
                </View>
              </View>

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

              {/* Error Message */}
              {error && (
                <View
                  style={{
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: withOpacity(colors.destructive, 'subtle'),
                    borderWidth: 1,
                    borderColor: withOpacity(colors.destructive, 'light'),
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.destructive }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
                <Button
                  variant="outline"
                  size="lg"
                  onPress={onClose}
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onPress={handleSave}
                  style={{ flex: 1 }}
                  disabled={isSaving || !newValue.trim() || !reason.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save Override'}
                </Button>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
