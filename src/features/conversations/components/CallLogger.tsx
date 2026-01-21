// src/features/conversations/components/CallLogger.tsx
// Call Logger - Zone G Week 8
// Post-call sheet for logging call details and notes

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Phone, Clock, ArrowUpRight, ArrowDownLeft, X, Check, User, StickyNote } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Button, Badge } from '@/components/ui';

// ============================================
// Types
// ============================================

export interface CallLogData {
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  notes: string;
  outcome?: 'answered' | 'voicemail' | 'no_answer' | 'busy';
  followUpRequired?: boolean;
}

export interface CallLoggerProps {
  /** Contact name */
  contactName: string;

  /** Contact phone number */
  phoneNumber: string;

  /** Callback when call is logged */
  onSave: (data: CallLogData) => void;

  /** Callback when cancelled */
  onCancel: () => void;

  /** Pre-fill direction */
  initialDirection?: 'inbound' | 'outbound';
}

// ============================================
// Duration Picker
// ============================================

interface DurationPickerProps {
  value: number;
  onChange: (seconds: number) => void;
}

function DurationPicker({ value, onChange }: DurationPickerProps) {
  const colors = useThemeColors();

  const presets = [
    { label: '1 min', seconds: 60 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
    { label: '30 min', seconds: 1800 },
  ];

  const handlePresetPress = useCallback((seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(seconds);
  }, [onChange]);

  // Format custom display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        <Clock size={ICON_SIZES.sm} color={colors.mutedForeground} />
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
          Duration
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginLeft: 'auto' }}>
          {formatDuration(value)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.seconds}
            onPress={() => handlePresetPress(preset.seconds)}
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: value === preset.seconds ? colors.primary : colors.muted,
              borderWidth: 1,
              borderColor: value === preset.seconds ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: value === preset.seconds ? colors.primaryForeground : colors.foreground,
              }}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================
// Outcome Selector
// ============================================

interface OutcomeSelectorProps {
  value?: 'answered' | 'voicemail' | 'no_answer' | 'busy';
  onChange: (outcome: 'answered' | 'voicemail' | 'no_answer' | 'busy') => void;
}

function OutcomeSelector({ value, onChange }: OutcomeSelectorProps) {
  const colors = useThemeColors();

  const outcomes = [
    { value: 'answered' as const, label: 'Answered', color: colors.success },
    { value: 'voicemail' as const, label: 'Voicemail', color: colors.warning },
    { value: 'no_answer' as const, label: 'No Answer', color: colors.destructive },
    { value: 'busy' as const, label: 'Busy', color: colors.mutedForeground },
  ];

  const handlePress = useCallback((outcome: 'answered' | 'voicemail' | 'no_answer' | 'busy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(outcome);
  }, [onChange]);

  return (
    <View style={{ gap: SPACING.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
        Outcome
      </Text>
      <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
        {outcomes.map((outcome) => (
          <TouchableOpacity
            key={outcome.value}
            onPress={() => handlePress(outcome.value)}
            style={{
              flex: 1,
              paddingVertical: SPACING.sm,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: value === outcome.value ? withOpacity(outcome.color, 'light') : colors.muted,
              borderWidth: 1,
              borderColor: value === outcome.value ? outcome.color : colors.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: value === outcome.value ? outcome.color : colors.foreground,
              }}
            >
              {outcome.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================
// Main Component
// ============================================

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
  const [outcome, setOutcome] = useState<'answered' | 'voicemail' | 'no_answer' | 'busy'>('answered');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  // Toggle direction
  const toggleDirection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDirection((prev) => (prev === 'inbound' ? 'outbound' : 'inbound'));
  }, []);

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
        <View style={{ gap: SPACING.sm }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
            Direction
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={() => setDirection('outbound')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.xs,
                paddingVertical: SPACING.md,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: direction === 'outbound' ? withOpacity(colors.primary, 'light') : colors.muted,
                borderWidth: 1,
                borderColor: direction === 'outbound' ? colors.primary : colors.border,
              }}
            >
              <ArrowUpRight size={18} color={direction === 'outbound' ? colors.primary : colors.foreground} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: direction === 'outbound' ? colors.primary : colors.foreground,
                }}
              >
                Outbound
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDirection('inbound')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.xs,
                paddingVertical: SPACING.md,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: direction === 'inbound' ? withOpacity(colors.success, 'light') : colors.muted,
                borderWidth: 1,
                borderColor: direction === 'inbound' ? colors.success : colors.border,
              }}
            >
              <ArrowDownLeft size={18} color={direction === 'inbound' ? colors.success : colors.foreground} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: direction === 'inbound' ? colors.success : colors.foreground,
                }}
              >
                Inbound
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
