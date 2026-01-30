// src/features/conversations/components/VoiceMemoRecorder.tsx
// Voice Memo Recorder - Zone G Week 8
// Records audio, transcribes with Whisper, optionally retains audio

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import {
  VoiceMemoStatus,
  VoiceMemoControls,
  useVoiceMemoRecording,
  VoiceMemoRecorderProps,
  VoiceMemoSaveData,
} from './voice-memo-recorder';

// Re-export types for backward compatibility
export type { VoiceMemoSaveData, VoiceMemoRecorderProps };

export function VoiceMemoRecorder({
  onSave,
  onCancel,
  maxDuration = 300, // 5 minutes default
  allowAudioRetention = true,
}: VoiceMemoRecorderProps) {
  const colors = useThemeColors();

  const {
    state,
    duration,
    error,
    formatDuration,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    showSaveOptions,
    handleCancel,
  } = useVoiceMemoRecording({
    maxDuration,
    allowAudioRetention,
    onSave,
    onCancel,
  });

  return (
    <View
      style={{
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: colors.card,
        gap: SPACING.md,
        ...getShadowStyle(colors, { size: 'md' }),
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          Voice Memo
        </Text>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <VoiceMemoStatus
        state={state}
        duration={duration}
        formatDuration={formatDuration}
      />

      {/* Error */}
      {error && (
        <Text style={{ fontSize: 13, color: colors.destructive, textAlign: 'center' }}>
          {error}
        </Text>
      )}

      {/* Controls */}
      <VoiceMemoControls
        state={state}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPlayRecording={playRecording}
        onPausePlayback={pausePlayback}
        onSave={showSaveOptions}
      />

      {/* Help text */}
      <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>
        {state === 'idle' && 'Your recording will be transcribed and the audio deleted for privacy'}
        {state === 'recording' && `Max ${Math.floor(maxDuration / 60)} minutes`}
        {(state === 'recorded' || state === 'playing') && 'Tap checkmark to transcribe and save'}
      </Text>
    </View>
  );
}

export default VoiceMemoRecorder;
