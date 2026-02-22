// src/features/assistant/components/PatchSetActionButtons.tsx
// Cancel and Apply action buttons for PatchSet preview

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { LoadingSpinner } from '@/components/ui';

interface PatchSetActionButtonsProps {
  opsCount: number;
  isApplying: boolean;
  onCancel: () => void;
  onApply: () => void;
}

export function PatchSetActionButtons({
  opsCount,
  isApplying,
  onCancel,
  onApply,
}: PatchSetActionButtonsProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
        onPress={onCancel}
        disabled={isApplying}
        accessibilityRole="button"
        accessibilityLabel="Cancel and close preview"
      >
        <X size={ICON_SIZES.ml} color={colors.mutedForeground} />
        <Text style={[styles.buttonText, { color: colors.mutedForeground }]}>
          Cancel
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.applyButton,
          { backgroundColor: colors.primary },
          isApplying && styles.buttonDisabled,
        ]}
        onPress={onApply}
        disabled={isApplying}
        accessibilityRole="button"
        accessibilityLabel={`Apply ${opsCount} change${opsCount !== 1 ? 's' : ''}`}
        accessibilityState={{ disabled: isApplying }}
      >
        {isApplying ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            <Check size={ICON_SIZES.ml} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Apply Changes
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  cancelButton: {
    borderWidth: 1,
  },
  applyButton: {},
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
