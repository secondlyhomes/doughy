// src/features/focus/components/TouchLogSheet.tsx
// Bottom sheet for logging call touches (smart touch tracking)

import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, Alert } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useCreateTouch, TouchType, TouchOutcome } from '../hooks/useContactTouches';
import { TouchLogSheetProps, TOUCH_TYPES } from './touch-log-types';
import { TouchTypeSelector } from './TouchTypeSelector';
import { OutcomeSelector } from './OutcomeSelector';
import { RespondedToggle } from './RespondedToggle';

export function TouchLogSheet({
  visible,
  onClose,
  focusedProperty,
  onSuccess,
}: TouchLogSheetProps) {
  const colors = useThemeColors();
  const { mutateAsync: createTouch, isPending } = useCreateTouch();

  // Form state
  const [touchType, setTouchType] = useState<TouchType>('first_call');
  const [outcome, setOutcome] = useState<TouchOutcome>('no_answer');
  const [responded, setResponded] = useState(false);
  const [notes, setNotes] = useState('');

  // Reset form on close
  const handleClose = useCallback(() => {
    setTouchType('first_call');
    setOutcome('no_answer');
    setResponded(false);
    setNotes('');
    onClose();
  }, [onClose]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      if (!focusedProperty?.leadId) {
        Alert.alert('Error', 'No lead associated with this property.');
        return;
      }

      await createTouch({
        lead_id: focusedProperty.leadId,
        // Only include property_id if it's a valid non-empty string
        ...(focusedProperty.id ? { property_id: focusedProperty.id } : {}),
        touch_type: touchType,
        outcome,
        responded,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Touch Logged',
        `${TOUCH_TYPES.find(t => t.value === touchType)?.label} logged for ${focusedProperty.leadName || 'this lead'}.`
      );

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to log touch:', error);
      Alert.alert('Error', 'Failed to log touch. Please try again.');
    }
  }, [createTouch, touchType, outcome, responded, notes, focusedProperty, handleClose, onSuccess]);

  // Automatically set responded based on outcome
  const handleOutcomeChange = useCallback((newOutcome: TouchOutcome) => {
    setOutcome(newOutcome);
    // Auto-set responded for outcomes that imply contact
    if (newOutcome === 'connected' || newOutcome === 'callback_scheduled') {
      setResponded(true);
    } else {
      setResponded(false);
    }
  }, []);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Log Call"
      snapPoints={['70%']}
    >
      {/* Lead Info */}
      {focusedProperty && (
        <View
          style={{
            backgroundColor: withOpacity(colors.primary, 'light'),
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.md,
            marginBottom: SPACING.md,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: colors.primary }}>
            {focusedProperty.leadName || 'Unknown Lead'}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground, marginTop: 2 }}>
            {focusedProperty.address}, {focusedProperty.city}
          </Text>
        </View>
      )}

      <TouchTypeSelector touchType={touchType} onSelect={setTouchType} />

      <OutcomeSelector outcome={outcome} onSelect={handleOutcomeChange} />

      <RespondedToggle responded={responded} onToggle={setResponded} />

      {/* Notes (Optional) */}
      <BottomSheetSection title="Notes (optional)">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Quick notes about the call..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{
            backgroundColor: colors.muted,
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.md,
            fontSize: FONT_SIZES.sm,
            color: colors.foreground,
            minHeight: 80,
          }}
        />
      </BottomSheetSection>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.md, paddingBottom: SPACING.lg }}>
        <Button
          variant="outline"
          onPress={handleClose}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          onPress={handleSave}
          disabled={isPending || !focusedProperty?.leadId}
          loading={isPending}
          style={{ flex: 1 }}
        >
          Log Call
        </Button>
      </View>
    </BottomSheet>
  );
}

export default TouchLogSheet;
