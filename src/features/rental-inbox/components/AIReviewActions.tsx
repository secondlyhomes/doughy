// src/features/rental-inbox/components/AIReviewActions.tsx
// Action buttons for the AIReviewCard — approve, reject, edit, cancel

import React from 'react';
import { View, Text } from 'react-native';
import { Check, X, Pencil } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { SPACING } from '@/constants/design-tokens';
import { styles } from './ai-review-styles';

interface AIReviewActionsProps {
  isEditing: boolean;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
}

export function AIReviewActions({
  isEditing,
  isProcessing,
  onApprove,
  onReject,
  onEdit,
  onCancelEdit,
}: AIReviewActionsProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.actions}>
      {isEditing ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onPress={onCancelEdit}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onPress={onApprove}
            disabled={isProcessing}
            loading={isProcessing}
          >
            <Check size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: SPACING.xs }}>
              Send Edited
            </Text>
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onPress={onReject}
            disabled={isProcessing}
          >
            <X size={14} color={colors.destructive} />
            <Text style={{ color: colors.destructive, marginLeft: SPACING.xs }}>
              Reject
            </Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={onEdit}
            disabled={isProcessing}
          >
            <Pencil size={14} color={colors.foreground} />
            <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>
              Edit
            </Text>
          </Button>
          <Button
            variant="default"
            size="sm"
            onPress={onApprove}
            disabled={isProcessing}
            loading={isProcessing}
          >
            <Check size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: SPACING.xs }}>
              Approve
            </Text>
          </Button>
        </>
      )}
    </View>
  );
}
