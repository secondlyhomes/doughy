// src/components/ui/FormField.tsx
// Standardized form field component with label, input, error, and helper text
// Consolidates form input patterns across AddCompSheet, AddRepairSheet, AddFinancingSheet, etc.

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

export interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  /** Field label */
  label: string;
  /** Current field value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Mark field as required (shows asterisk) */
  required?: boolean;
  /** Icon component to display on the left */
  icon?: LucideIcon;
  /** Prefix text (e.g., "$" for currency) */
  prefix?: string;
  /** Suffix text (e.g., "%" for percentage) */
  suffix?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Keyboard type */
  keyboardType?: TextInputProps['keyboardType'];
  /** Auto-capitalize mode */
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
  /** Disable the field */
  editable?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  icon: Icon,
  prefix,
  suffix,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  ...textInputProps
}: FormFieldProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
      </View>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: editable ? colors.background : colors.muted,
            borderColor: error ? colors.destructive : colors.border,
          },
          multiline && styles.inputContainerMultiline,
        ]}
      >
        {/* Icon */}
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={colors.mutedForeground} />
          </View>
        )}

        {/* Prefix */}
        {prefix && (
          <Text style={[styles.affix, { color: colors.mutedForeground }]}>
            {prefix}
          </Text>
        )}

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground },
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          {...textInputProps}
        />

        {/* Suffix */}
        {suffix && (
          <Text style={[styles.affix, { color: colors.mutedForeground }]}>
            {suffix}
          </Text>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </Text>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    minHeight: 80,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  affix: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  helperText: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});

export default FormField;
