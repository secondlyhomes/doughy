// Add Lead Screen - Quick Capture Section
// Voice recording and business card photo capture

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface LeadQuickCaptureSectionProps {
  voiceState: {
    isRecording: boolean;
    isTranscribing: boolean;
    isExtracting: boolean;
    duration: number;
  };
  photoState: {
    isCapturing: boolean;
    isExtracting: boolean;
  };
  formatDuration: (duration: number) => string;
  onVoiceCapture: () => void;
  onPhotoCapture: () => void;
}

export function LeadQuickCaptureSection({
  voiceState,
  photoState,
  formatDuration,
  onVoiceCapture,
  onPhotoCapture,
}: LeadQuickCaptureSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-6 p-4 rounded-xl" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
      <Text className="text-base font-semibold mb-3" style={{ color: colors.foreground }}>
        Quick Capture
      </Text>
      <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
        Use voice or scan a business card to auto-fill lead information
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
                Card
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
