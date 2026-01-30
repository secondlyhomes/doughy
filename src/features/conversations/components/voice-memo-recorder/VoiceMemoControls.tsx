// src/features/conversations/components/voice-memo-recorder/VoiceMemoControls.tsx
// Control buttons for voice memo recording

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Mic, Square, Play, Pause, Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import type { RecordingState } from './types';

interface VoiceMemoControlsProps {
  state: RecordingState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onPausePlayback: () => void;
  onSave: () => void;
}

export function VoiceMemoControls({
  state,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onPausePlayback,
  onSave,
}: VoiceMemoControlsProps) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.md }}>
      {state === 'idle' && (
        <TouchableOpacity
          onPress={onStartRecording}
          accessibilityLabel="Start recording"
          accessibilityHint="Double tap to begin recording a voice memo"
          accessibilityRole="button"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.destructive,
            alignItems: 'center',
            justifyContent: 'center',
            ...getShadowStyle(colors, { size: 'md' }),
          }}
        >
          <Mic size={28} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      {state === 'recording' && (
        <TouchableOpacity
          onPress={onStopRecording}
          accessibilityLabel="Stop recording"
          accessibilityHint="Double tap to stop recording"
          accessibilityRole="button"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.destructive,
            alignItems: 'center',
            justifyContent: 'center',
            ...getShadowStyle(colors, { size: 'md' }),
          }}
        >
          <Square size={24} color={colors.primaryForeground} fill={colors.primaryForeground} />
        </TouchableOpacity>
      )}

      {(state === 'recorded' || state === 'playing') && (
        <>
          <TouchableOpacity
            onPress={state === 'playing' ? onPausePlayback : onPlayRecording}
            accessibilityLabel={state === 'playing' ? 'Pause playback' : 'Play recording'}
            accessibilityHint={state === 'playing' ? 'Double tap to pause' : 'Double tap to listen'}
            accessibilityRole="button"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {state === 'playing' ? (
              <Pause size={24} color={colors.foreground} />
            ) : (
              <Play size={24} color={colors.foreground} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSave}
            accessibilityLabel="Save voice memo"
            accessibilityHint="Double tap to transcribe and save"
            accessibilityRole="button"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
