/**
 * OverrideSheetActions
 * Error display and action buttons for the OverrideCalculationSheet.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { Button } from './Button';

export interface OverrideSheetActionsProps {
  /** Validation error message */
  error: string;

  /** Whether save is in progress */
  isSaving: boolean;

  /** Current new value (for disabled state) */
  newValue: string;

  /** Current reason (for disabled state) */
  reason: string;

  /** Cancel handler */
  onClose: () => void;

  /** Save handler */
  onSave: () => void;
}

export function OverrideSheetActions({
  error,
  isSaving,
  newValue,
  reason,
  onClose,
  onSave,
}: OverrideSheetActionsProps) {
  const colors = useThemeColors();

  return (
    <>
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
          onPress={onSave}
          style={{ flex: 1 }}
          disabled={isSaving || !newValue.trim() || !reason.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Override'}
        </Button>
      </View>
    </>
  );
}
