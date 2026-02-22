// src/components/deals/EvidenceOverrideForm.tsx
// Override value form for EvidenceTrailModal

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { Button } from '@/components/ui';

interface EvidenceOverrideFormProps {
  overrideValue: string;
  overrideReason: string;
  onChangeValue: (value: string) => void;
  onChangeReason: (reason: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EvidenceOverrideForm({
  overrideValue,
  overrideReason,
  onChangeValue,
  onChangeReason,
  onSubmit,
  onCancel,
}: EvidenceOverrideFormProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: withOpacity(colors.primary, 'subtle'),
        borderWidth: 1,
        borderColor: withOpacity(colors.primary, 'light'),
        gap: SPACING.md,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
        Override Value
      </Text>

      <TextInput
        value={overrideValue}
        onChangeText={onChangeValue}
        placeholder="Enter new value"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="numeric"
        style={{
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 16,
          fontWeight: '600',
          color: colors.foreground,
        }}
      />

      <TextInput
        value={overrideReason}
        onChangeText={onChangeReason}
        placeholder="Reason for override (optional)"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={2}
        style={{
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 14,
          color: colors.foreground,
          minHeight: 60,
          textAlignVertical: 'top',
        }}
      />

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <Button variant="outline" onPress={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button onPress={onSubmit} style={{ flex: 1 }}>
          <Check size={16} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground }}> Save</Text>
        </Button>
      </View>
    </View>
  );
}
