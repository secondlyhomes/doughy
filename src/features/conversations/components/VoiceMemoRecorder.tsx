// src/features/conversations/components/VoiceMemoRecorder.tsx
// Voice Memo Recorder - Zone G Week 8
// Records audio, transcribes with Whisper, optionally retains audio

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { transcribeAudio } from '@/lib/openai';

// Lazy-load expo-av to prevent crash when native module isn't available (Expo Go)
let _Audio: typeof import('expo-av').Audio | null = null;
let _audioChecked = false;

function getAudio(): typeof import('expo-av').Audio | null {
  if (!_audioChecked) {
    _audioChecked = true;
    try {
      _Audio = require('expo-av').Audio;
    } catch {
      console.warn('[VoiceMemoRecorder] expo-av not available - voice recording disabled. Requires dev build.');
      _Audio = null;
    }
  }
  return _Audio;
}
import { Mic, Square, Play, Pause, X, Check, Loader2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Button } from '@/components/ui';

// ============================================
// Types
// ============================================

export interface VoiceMemoSaveData {
  transcript: string;
  durationSeconds: number;
  audioUri?: string; // Only included if user chose to keep audio
  keepAudio: boolean;
}

export interface VoiceMemoRecorderProps {
  /** Callback when recording is saved (extended to include audio retention choice) */
  onSave: (data: VoiceMemoSaveData) => void;

  /** Callback when recording is cancelled */
  onCancel: () => void;

  /** Optional max duration in seconds (default: 300 = 5 minutes) */
  maxDuration?: number;

  /** Allow user to choose audio retention (default: true) */
  allowAudioRetention?: boolean;

  /** Lead ID for context */
  leadId?: string;

  /** Deal ID for context */
  dealId?: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing' | 'transcribing';

// ============================================
// Recording Indicator Animation
// ============================================

function RecordingIndicator() {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.destructive,
        },
        animatedStyle,
      ]}
    />
  );
}

// ============================================
// Main Component
// ============================================

export function VoiceMemoRecorder({
  onSave,
  onCancel,
  maxDuration = 300, // 5 minutes default
  allowAudioRetention = true,
}: VoiceMemoRecorderProps) {
  const colors = useThemeColors();
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use 'any' for refs since Audio types aren't available when module isn't linked
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const stopRecordingRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Fire-and-forget with error handling to prevent memory leaks
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Check if expo-av is available
      const Audio = getAudio();
      if (!Audio) {
        Alert.alert('Not Available', 'Voice recording requires a development build');
        setError('Voice recording requires a development build');
        return;
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission is required to record voice memos');
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      setState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            // Use ref to avoid stale closure
            stopRecordingRef.current?.();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  }, [maxDuration]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!recordingRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingUriRef.current = uri;
      recordingRef.current = null;

      // Reset audio mode
      const Audio = getAudio();
      if (Audio) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      setState('recorded');
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording. Please try again.');
    }
  }, []);

  // Keep ref updated for timer callback to avoid stale closure
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Play recording
  const playRecording = useCallback(async () => {
    try {
      if (!recordingUriRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const Audio = getAudio();
      if (!Audio) {
        Alert.alert('Not Available', 'Audio playback requires a development build');
        return;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUriRef.current },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState('recorded');
        }
      });

      setState('playing');
    } catch (err) {
      console.error('Failed to play recording:', err);
      setError('Failed to play recording.');
    }
  }, []);

  // Pause playback
  const pausePlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setState('recorded');
      }
    } catch (err) {
      console.error('Failed to pause playback:', err);
    }
  }, []);

  // Show save options dialog
  const showSaveOptions = useCallback(() => {
    if (!recordingUriRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (allowAudioRetention) {
      Alert.alert(
        'Save Voice Memo',
        'Would you like to keep the audio file? Audio is kept for 7 days to allow review if transcription has errors.',
        [
          {
            text: 'Transcript Only',
            onPress: () => transcribeAndSave(false),
            style: 'default',
          },
          {
            text: 'Keep Audio (7 days)',
            onPress: () => transcribeAndSave(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // If audio retention is disabled, just transcribe and delete
      transcribeAndSave(false);
    }
  }, [allowAudioRetention]);

  // Transcribe and save
  const transcribeAndSave = useCallback(async (keepAudio: boolean) => {
    try {
      if (!recordingUriRef.current) return;

      setState('transcribing');
      setError(null);

      const audioUri = recordingUriRef.current;

      // Call real Whisper API via edge function
      let realTranscript: string;
      try {
        realTranscript = await transcribeAudio(audioUri);
      } catch (transcribeError) {
        console.error('Transcription failed:', transcribeError);
        // Fall back to placeholder if transcription fails
        realTranscript = '[Transcription failed - audio saved]';
      }

      setTranscript(realTranscript);

      // Save with callback, including audio retention choice
      onSave({
        transcript: realTranscript,
        durationSeconds: duration,
        audioUri: keepAudio ? audioUri : undefined,
        keepAudio,
      });

      // Clear the ref (caller is responsible for audio file management)
      if (!keepAudio) {
        recordingUriRef.current = null;
      }
    } catch (err) {
      console.error('Failed to transcribe:', err);
      setError('Failed to transcribe audio. Please try again.');
      setState('recorded');
    }
  }, [duration, onSave]);

  // Cancel recording
  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }

    recordingUriRef.current = null;
    onCancel();
  }, [onCancel]);

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

      {/* Error */}
      {error && (
        <Text style={{ fontSize: 13, color: colors.destructive, textAlign: 'center' }}>
          {error}
        </Text>
      )}

      {/* Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.md }}>
        {state === 'idle' && (
          <TouchableOpacity
            onPress={startRecording}
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
            onPress={stopRecording}
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
              onPress={state === 'playing' ? pausePlayback : playRecording}
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
              onPress={showSaveOptions}
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
