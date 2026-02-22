// src/features/conversations/components/voice-memo-recorder/VoiceMemoStatus.tsx
// Status display for voice memo recording states

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import { RecordingIndicator } from './RecordingIndicator';
import type { RecordingState } from './types';

interface VoiceMemoStatusProps {
  state: RecordingState;
  duration: number;
  formatDuration: (seconds: number) => string;
}

export function VoiceMemoStatus({ state, duration, formatDuration }: VoiceMemoStatusProps) {
  const colors = useThemeColors();

  return (
    <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
      {state === 'idle' && (
        <>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: withOpacity(colors.primary, 'light'),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: SPACING.md,
            }}
          >
            <Mic size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            Tap to start recording
          </Text>
        </>
      )}

      {state === 'recording' && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <RecordingIndicator />
            <Text style={{ fontSize: 32, fontWeight: '700', color: colors.foreground }}>
              {formatDuration(duration)}
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.destructive }}>
            Recording...
          </Text>
        </>
      )}

      {(state === 'recorded' || state === 'playing') && (
        <>
          <Text style={{ fontSize: 32, fontWeight: '700', color: colors.foreground, marginBottom: SPACING.sm }}>
            {formatDuration(duration)}
          </Text>
          <Text style={{ fontSize: 14, color: colors.success }}>
            Recording complete
          </Text>
        </>
      )}

      {state === 'transcribing' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 14, color: colors.primary, marginTop: SPACING.md }}>
            Transcribing with AI...
          </Text>
        </>
      )}
    </View>
  );
}
