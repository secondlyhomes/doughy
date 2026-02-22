// src/features/real-estate/components/WizardQuickCapture.tsx
// AI Quick Capture panel (voice + photo) for PropertyFormWizard

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface VoiceCaptureState {
  isRecording: boolean;
  isTranscribing: boolean;
  isExtracting: boolean;
  duration: number;
}

interface PhotoExtractState {
  isCapturing: boolean;
  isExtracting: boolean;
}

interface WizardQuickCaptureProps {
  voiceState: VoiceCaptureState;
  photoState: PhotoExtractState;
  onVoiceCapture: () => void;
  onPhotoCapture: () => void;
  formatDuration: (duration: number) => string;
}

export function WizardQuickCapture({
  voiceState,
  photoState,
  onVoiceCapture,
  onPhotoCapture,
  formatDuration,
}: WizardQuickCaptureProps) {
  const colors = useThemeColors();

  return (
    <View className="mx-4 mt-4 mb-2 p-4 rounded-xl" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
      <Text className="text-base font-semibold mb-2" style={{ color: colors.foreground }}>
        Quick Capture
      </Text>
      <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
        Use voice or scan MLS/tax documents to auto-fill property details
      </Text>
      <View className="flex-row gap-3">
        {/* Voice Capture Button */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg"
          style={{ backgroundColor: voiceState.isRecording ? colors.destructive : colors.primary }}
          onPress={onVoiceCapture}
          disabled={voiceState.isTranscribing || voiceState.isExtracting}
        >
          {voiceState.isTranscribing || voiceState.isExtracting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Mic size={18} color={colors.primaryForeground} />
              <Text className="ml-2 font-medium" style={{ color: colors.primaryForeground }}>
                {voiceState.isRecording ? 'Stop' : 'Voice'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Photo Capture Button */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg"
          style={{ backgroundColor: colors.primary }}
          onPress={onPhotoCapture}
          disabled={photoState.isCapturing || photoState.isExtracting}
        >
          {photoState.isCapturing || photoState.isExtracting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Camera size={18} color={colors.primaryForeground} />
              <Text className="ml-2 font-medium" style={{ color: colors.primaryForeground }}>
                Scan
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {voiceState.isRecording && (
        <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
          Recording: {formatDuration(voiceState.duration)}
        </Text>
      )}
    </View>
  );
}
