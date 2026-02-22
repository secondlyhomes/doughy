// src/features/capture/screens/QuickNoteSheet.tsx
// Bottom sheet for creating a quick note

import React from 'react';
import { View, TextInput } from 'react-native';
import { BottomSheet, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface QuickNoteSheetProps {
  visible: boolean;
  onClose: () => void;
  noteText: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  isCreating: boolean;
}

export function QuickNoteSheet({
  visible,
  onClose,
  noteText,
  onChangeText,
  onSave,
  isCreating,
}: QuickNoteSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Quick Note"
      snapPoints={['50%']}
    >
      <View style={{ gap: SPACING.md }}>
        <TextInput
          value={noteText}
          onChangeText={onChangeText}
          placeholder="Enter your note..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
          style={{
            backgroundColor: colors.muted,
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.md,
            fontSize: 16,
            color: colors.foreground,
            minHeight: 120,
          }}
        />
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <Button
            variant="secondary"
            onPress={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={onSave}
            disabled={!noteText.trim() || isCreating}
            loading={isCreating}
            style={{ flex: 1 }}
          >
            Save
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
