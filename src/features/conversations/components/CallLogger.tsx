// src/features/conversations/components/CallLogger.tsx
// Call Logger - Zone G Week 8
// Post-call sheet for logging call details and notes

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, User, StickyNote } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Button } from '@/components/ui';
import { DirectionToggle } from './DirectionToggle';
import { DurationPicker } from './DurationPicker';
import { OutcomeSelector } from './OutcomeSelector';
import type { CallLoggerProps, CallOutcome } from './call-logger-types';

// Re-export types for barrel consumers
export type { CallLogData, CallLoggerProps } from './call-logger-types';

export function CallLogger({
  contactName,
  phoneNumber,
  onSave,
  onCancel,
  initialDirection = 'outbound',
}: CallLoggerProps) {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });

  const [direction, setDirection] = useState<'inbound' | 'outbound'>(initialDirection);
  const [duration, setDuration] = useState(300); // 5 min default
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<CallOutcome>('answered');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  // Toggle follow-up
  const toggleFollowUp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowUpRequired((prev) => !prev);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      direction,
      durationSeconds: duration,
      notes,
      outcome,
      followUpRequired,
    });
  }, [direction, duration, notes, outcome, followUpRequired, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  }, [onCancel]);

  return (
    <KeyboardAvoidingView
      behavior={keyboardProps.behavior}
      keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SPACING.lg,
          gap: SPACING.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
            Log Call
          </Text>
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.lg,
            backgroundColor: colors.muted,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
              {contactName}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
              {phoneNumber}
            </Text>
          </View>
        </View>

        {/* Direction Toggle */}
        <DirectionToggle value={direction} onChange={setDirection} />

        {/* Duration */}
        <DurationPicker value={duration} onChange={setDuration} />

        {/* Outcome */}
        <OutcomeSelector value={outcome} onChange={setOutcome} />

        {/* Notes */}
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <StickyNote size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
              Notes
            </Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="What was discussed? Any key points or action items?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            style={{
              padding: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: colors.muted,
              borderWidth: 1,
              borderColor: colors.border,
              fontSize: 14,
              color: colors.foreground,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Follow-up Toggle */}
        <TouchableOpacity
          onPress={toggleFollowUp}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: followUpRequired ? withOpacity(colors.warning, 'subtle') : colors.muted,
            borderWidth: 1,
            borderColor: followUpRequired ? colors.warning : colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
            Follow-up required
          </Text>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: followUpRequired ? colors.warning : 'transparent',
              borderWidth: followUpRequired ? 0 : 2,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {followUpRequired && <Check size={14} color={colors.primaryForeground} />}
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
          <Button variant="outline" onPress={handleCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onPress={handleSave} style={{ flex: 1 }}>
            <Check size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>Log Call</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CallLogger;
