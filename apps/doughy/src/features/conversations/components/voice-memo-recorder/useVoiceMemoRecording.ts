// src/features/conversations/components/voice-memo-recorder/useVoiceMemoRecording.ts
// Custom hook for voice memo recording logic

import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { transcribeAudio } from '@/lib/openai';
import type { RecordingState, VoiceMemoSaveData } from './types';

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

interface UseVoiceMemoRecordingOptions {
  maxDuration: number;
  allowAudioRetention: boolean;
  onSave: (data: VoiceMemoSaveData) => void;
  onCancel: () => void;
}

export function useVoiceMemoRecording({
  maxDuration,
  allowAudioRetention,
  onSave,
  onCancel,
}: UseVoiceMemoRecordingOptions) {
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
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

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
  }, [allowAudioRetention, transcribeAndSave]);

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

  return {
    state,
    duration,
    transcript,
    error,
    formatDuration,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    showSaveOptions,
    handleCancel,
  };
}
