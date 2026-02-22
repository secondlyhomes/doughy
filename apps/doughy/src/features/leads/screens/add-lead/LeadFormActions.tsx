// Add Lead Screen - Form Actions
// Submit and Cancel buttons

import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface LeadFormActionsProps {
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function LeadFormActions({
  isPending,
  onSubmit,
  onCancel,
}: LeadFormActionsProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Submit Button */}
      <TouchableOpacity
        className="rounded-lg py-4 items-center"
        style={{ backgroundColor: isPending ? withOpacity(colors.primary, 'opaque') : colors.primary }}
        onPress={onSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
            Create Lead
          </Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        className="rounded-lg py-4 items-center mt-3"
        onPress={onCancel}
      >
        <Text className="font-medium text-base" style={{ color: colors.mutedForeground }}>Cancel</Text>
      </TouchableOpacity>
    </>
  );
}
