// src/features/admin/screens/ai-security-dashboard/PatternListView.tsx
// List view for browsing and managing security patterns

import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  Button,
  StepUpVerificationSheet,
} from '@/components/ui';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';

import type { SecurityPattern } from './types';
import { PatternListItem } from './PatternListItem';
import type { usePatternEditor } from './usePatternEditor';

interface PatternListViewProps {
  visible: boolean;
  onClose: () => void;
  patterns: SecurityPattern[];
  editor: ReturnType<typeof usePatternEditor>;
}

export function PatternListView({ visible, onClose, patterns, editor }: PatternListViewProps) {
  const colors = useThemeColors();

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title="Security Patterns"
        snapPoints={['85%']}
        scrollable={false}
      >
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => {
              editor.resetForm();
              editor.setMode('add');
            }}
            style={{ marginBottom: SPACING.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="add" size={ICON_SIZES.ml} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Pattern</Text>
            </View>
          </Button>

          <FlatList
            data={patterns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PatternListItem
                item={item}
                togglingId={editor.togglingId}
                onToggleActive={editor.handleToggleActive}
                onEdit={(editItem) => {
                  editor.setEditingPattern(editItem);
                  editor.setMode('edit');
                }}
                onDelete={editor.handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons
                  name="shield-outline"
                  size={ICON_SIZES['3xl']}
                  color={colors.mutedForeground}
                />
                <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
                  No patterns configured
                </Text>
              </View>
            }
          />
        </View>
      </BottomSheet>

      {/* Step-up verification sheet for MFA on destructive actions */}
      <StepUpVerificationSheet
        visible={editor.showStepUpSheet}
        onClose={editor.handleStepUpCancel}
        onVerify={editor.handleStepUpVerify}
        state={editor.stepUpState}
      />
    </>
  );
}
