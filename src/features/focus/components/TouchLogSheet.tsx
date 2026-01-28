// src/features/focus/components/TouchLogSheet.tsx
// Bottom sheet for logging call touches (smart touch tracking)

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import {
  Phone,
  PhoneCall,
  Voicemail,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useCreateTouch, TouchType, TouchOutcome } from '../hooks/useContactTouches';
import { FocusedProperty } from '@/context/FocusModeContext';

// ============================================
// Types
// ============================================

interface TouchLogSheetProps {
  visible: boolean;
  onClose: () => void;
  focusedProperty?: FocusedProperty | null;
  onSuccess?: () => void;
}

interface TouchTypeOption {
  value: TouchType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

interface OutcomeOption {
  value: TouchOutcome;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

// ============================================
// Constants
// ============================================

const TOUCH_TYPES: TouchTypeOption[] = [
  { value: 'first_call', label: 'First Call', icon: Phone },
  { value: 'follow_up', label: 'Follow-up', icon: PhoneCall },
  { value: 'voicemail', label: 'Voicemail', icon: Voicemail },
];

const OUTCOMES: OutcomeOption[] = [
  { value: 'connected', label: 'Connected', icon: CheckCircle2 },
  { value: 'no_answer', label: 'No Answer', icon: XCircle },
  { value: 'voicemail_left', label: 'Left Voicemail', icon: Voicemail },
  { value: 'callback_scheduled', label: 'Callback Scheduled', icon: Clock },
];

// ============================================
// Component
// ============================================

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
        property_id: focusedProperty.id,
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
            {focusedProperty.leadName || 'Unknown Lead'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
            {focusedProperty.address}, {focusedProperty.city}
          </Text>
        </View>
      )}

      {/* Touch Type Selection */}
      <BottomSheetSection title="Call Type">
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {TOUCH_TYPES.map((type) => {
            const isSelected = touchType === type.value;
            const IconComponent = type.icon;
            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => setTouchType(type.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: isSelected ? colors.primary : colors.muted,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <IconComponent
                  size={ICON_SIZES.sm}
                  color={isSelected ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Outcome Selection */}
      <BottomSheetSection title="Outcome">
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
          {OUTCOMES.map((o) => {
            const isSelected = outcome === o.value;
            const IconComponent = o.icon;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => handleOutcomeChange(o.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: isSelected
                    ? o.value === 'connected' ? colors.success
                    : o.value === 'no_answer' ? colors.warning
                    : colors.primary
                    : colors.muted,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? o.value === 'connected' ? colors.success
                    : o.value === 'no_answer' ? colors.warning
                    : colors.primary
                    : colors.border,
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <IconComponent
                  size={ICON_SIZES.sm}
                  color={isSelected ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Responded Toggle */}
      <BottomSheetSection title="Did they engage?">
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity
            onPress={() => setResponded(true)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.xs,
              paddingVertical: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: responded ? colors.success : colors.muted,
              borderWidth: 1,
              borderColor: responded ? colors.success : colors.border,
            }}
          >
            <CheckCircle2
              size={ICON_SIZES.sm}
              color={responded ? colors.primaryForeground : colors.foreground}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: responded ? colors.primaryForeground : colors.foreground,
              }}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setResponded(false)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACING.xs,
              paddingVertical: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: !responded ? colors.destructive : colors.muted,
              borderWidth: 1,
              borderColor: !responded ? colors.destructive : colors.border,
            }}
          >
            <XCircle
              size={ICON_SIZES.sm}
              color={!responded ? colors.destructiveForeground : colors.foreground}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: !responded ? colors.destructiveForeground : colors.foreground,
              }}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetSection>

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
            fontSize: 14,
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
