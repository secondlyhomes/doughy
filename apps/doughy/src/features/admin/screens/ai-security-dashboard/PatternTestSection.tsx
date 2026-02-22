// src/features/admin/screens/ai-security-dashboard/PatternTestSection.tsx
// Test section for validating regex patterns against sample input

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheetSection, FormField } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

interface PatternTestResult {
  matches: boolean;
  error?: string;
}

interface PatternTestSectionProps {
  testInput: string;
  onTestInputChange: (value: string) => void;
  testResult: PatternTestResult | null;
}

export function PatternTestSection({
  testInput,
  onTestInputChange,
  testResult,
}: PatternTestSectionProps) {
  const colors = useThemeColors();

  return (
    <FocusedSheetSection title="Test Pattern">
      <FormField
        label="Test Input"
        value={testInput}
        onChangeText={onTestInputChange}
        placeholder="Enter text to test against the pattern"
        multiline
        numberOfLines={3}
      />

      {testResult && (
        <View
          style={{
            marginTop: SPACING.sm,
            padding: 12,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: testResult.error
              ? colors.destructive + '20'
              : testResult.matches
                ? colors.success + '20'
                : colors.muted,
          }}
        >
          {testResult.error ? (
            <Text style={{ color: colors.destructive, fontSize: 13 }}>
              Error: {testResult.error}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={testResult.matches ? 'checkmark-circle' : 'close-circle'}
                size={ICON_SIZES.ml}
                color={testResult.matches ? colors.success : colors.mutedForeground}
              />
              <Text
                style={{
                  marginLeft: 8,
                  color: testResult.matches ? colors.success : colors.mutedForeground,
                  fontSize: 13,
                }}
              >
                {testResult.matches ? 'Pattern matches!' : 'No match'}
              </Text>
            </View>
          )}
        </View>
      )}
    </FocusedSheetSection>
  );
}
