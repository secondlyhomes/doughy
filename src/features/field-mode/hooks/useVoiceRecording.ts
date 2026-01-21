// src/features/field-mode/hooks/useVoiceRecording.ts
// Hook for managing audio recording using expo-av

import { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceRecordingState } from '../types';

// Lazy-load expo-av to prevent crash when native module isn't available (Expo Go)
// Using a lazy getter defers the require() call until runtime, avoiding errors at module evaluation
let _Audio: typeof import('expo-av').Audio | null = null;
let _audioChecked = false;

function getAudioModule(): typeof import('expo-av').Audio | null {
  if (!_audioChecked) {
    _audioChecked = true;
    try {
      _Audio = require('expo-av').Audio;
    } catch {
      console.warn('[useVoiceRecording] expo-av not available - voice recording disabled. Requires dev build.');
      _Audio = null;
    }
  }
  return _Audio;
}

// Check if audio is available (for UI components)
export function isAudioAvailable(): boolean {
  return getAudioModule() !== null;
}

interface UseVoiceRecordingReturn {
  state: VoiceRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  playbackUri: (uri: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
  isPlaying: boolean;
  playbackPosition: number;
  playbackDuration: number;
  error: string | null;
  isAvailable: boolean;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: undefined,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use 'any' for refs since Audio types aren't available when module isn't linked
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    const Audio = getAudioModule();
    if (!Audio) {
      setError('Voice recording requires a development build');
      return;
    }

    try {
      setError(null);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission is required to record audio');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        uri: undefined,
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  }, []);

  // Stop recording and return URI
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset audio mode
      const Audio = getAudioModule();
      if (Audio) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        uri: uri || undefined,
      }));

      return uri;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
      return null;
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.pauseAsync();

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isPaused: true,
      }));
    } catch (err) {
      console.error('Failed to pause recording:', err);
      setError('Failed to pause recording');
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.startAsync();

      // Resume timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    } catch (err) {
      console.error('Failed to resume recording:', err);
      setError('Failed to resume recording');
    }
  }, []);

  // Cancel recording without saving
  const cancelRecording = useCallback(async () => {
    try {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // Reset audio mode
      const Audio = getAudioModule();
      if (Audio) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri: undefined,
      });
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    }
  }, []);

  // Play back a recorded audio file
  const playbackUri = useCallback(async (uri: string) => {
    const Audio = getAudioModule();
    if (!Audio) {
      setError('Audio playback requires a development build');
      return;
    }

    try {
      // Stop any existing playback
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Load and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError('Failed to play audio');
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    } catch (err) {
      console.error('Failed to stop playback:', err);
    }
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    playbackUri,
    stopPlayback,
    isPlaying,
    playbackPosition,
    playbackDuration,
    error,
    isAvailable: isAudioAvailable(),
  };
}

// Format seconds to MM:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
