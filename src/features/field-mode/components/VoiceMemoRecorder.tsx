// src/features/field-mode/components/VoiceMemoRecorder.tsx
// Voice memo recording component with playback support

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mic, Square, Pause, Play, X, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useVoiceRecording, formatDuration } from '../hooks/useVoiceRecording';
import { PhotoBucket, PHOTO_BUCKET_CONFIG } from '../../deals/types';

interface VoiceMemoRecorderProps {
  visible: boolean;
  bucket: PhotoBucket | null;
  onClose: () => void;
  onSave: (bucket: PhotoBucket, uri: string) => void;
}

export function VoiceMemoRecorder({
  visible,
  bucket,
  onClose,
  onSave,
}: VoiceMemoRecorderProps) {
  const colors = useThemeColors();
  const {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    error,
  } = useVoiceRecording();

  const bucketLabel = bucket ? PHOTO_BUCKET_CONFIG[bucket].label : '';

  // Handle save
  const handleSave = async () => {
    if (!bucket) return;

    const uri = await stopRecording();
    if (uri) {
      onSave(bucket, uri);
      onClose();
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    await cancelRecording();
    onClose();
  };

  // Handle close (cleanup if recording)
  const handleClose = () => {
    if (state.isRecording) {
      cancelRecording();
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={`Voice Memo: ${bucketLabel}`}
      maxHeight={350}
    >
      <View className="items-center py-6">
        {/* Recording visualization */}
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: state.isRecording
              ? colors.destructive + '20'
              : colors.primary + '20',
          }}
        >
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              backgroundColor: state.isRecording
                ? colors.destructive + '40'
                : colors.primary + '40',
            }}
          >
            <Mic
              size={40}
              color={state.isRecording ? colors.destructive : colors.primary}
            />
          </View>
        </View>

        {/* Duration display */}
        <Text className="text-3xl font-mono font-bold text-foreground mb-2">
          {formatDuration(state.duration)}
        </Text>

        {/* Status text */}
        <Text className="text-sm text-muted-foreground mb-6">
          {!state.isRecording && !state.uri && 'Tap to start recording'}
          {state.isRecording && !state.isPaused && 'Recording...'}
          {state.isRecording && state.isPaused && 'Paused'}
        </Text>

        {/* Error message */}
        {error && (
          <Text className="text-sm text-destructive mb-4">{error}</Text>
        )}

        {/* Controls */}
        <View className="flex-row items-center gap-6">
          {/* Not recording - show start button */}
          {!state.isRecording && (
            <TouchableOpacity
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={startRecording}
              accessibilityLabel="Start recording"
              accessibilityRole="button"
            >
              <Mic size={28} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}

          {/* Recording - show pause/resume and stop */}
          {state.isRecording && (
            <>
              {/* Cancel button */}
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
                onPress={handleCancel}
                accessibilityLabel="Cancel recording"
                accessibilityRole="button"
              >
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>

              {/* Pause/Resume button */}
              <TouchableOpacity
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.warning }}
                onPress={state.isPaused ? resumeRecording : pauseRecording}
                accessibilityLabel={state.isPaused ? 'Resume recording' : 'Pause recording'}
                accessibilityRole="button"
              >
                {state.isPaused ? (
                  <Play size={24} color={colors.warningForeground} />
                ) : (
                  <Pause size={24} color={colors.warningForeground} />
                )}
              </TouchableOpacity>

              {/* Stop/Save button */}
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.success }}
                onPress={handleSave}
                accessibilityLabel="Save recording"
                accessibilityRole="button"
              >
                <Check size={24} color={colors.successForeground} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Instructions */}
        <View className="mt-8 px-4">
          <Text className="text-xs text-muted-foreground text-center">
            Record observations about {bucketLabel.toLowerCase()}.
            {'\n'}Your notes will be transcribed and organized by AI.
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}
