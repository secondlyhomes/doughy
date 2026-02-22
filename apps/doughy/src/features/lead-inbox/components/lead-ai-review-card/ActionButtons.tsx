// src/features/lead-inbox/components/lead-ai-review-card/ActionButtons.tsx
// Action buttons for AI review card (Approve, Reject, Edit)

import React from 'react';
import { View, Text } from 'react-native';
import { Check, X, Pencil } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { styles } from './styles';

interface ActionButtonsProps {
  isEditing: boolean;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
}

export function ActionButtons({
  isEditing,
  isProcessing,
  onApprove,
  onReject,
  onEdit,
  onCancelEdit,
}: ActionButtonsProps) {
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
            <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>
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
            <Text style={{ color: colors.destructive, marginLeft: 4 }}>Reject</Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={onEdit}
            disabled={isProcessing}
          >
            <Pencil size={14} color={colors.foreground} />
            <Text style={{ color: colors.foreground, marginLeft: 4 }}>Edit</Text>
          </Button>
          <Button
            variant="default"
            size="sm"
            onPress={onApprove}
            disabled={isProcessing}
            loading={isProcessing}
          >
            <Check size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>
              Approve
            </Text>
          </Button>
        </>
      )}
    </View>
  );
}
