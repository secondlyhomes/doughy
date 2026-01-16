// src/features/real-estate/hooks/useVoiceCapture.ts
// Convenience hook combining voice recording with AI transcription and property extraction

import { useState, useCallback } from 'react';
import { useVoiceRecording, formatDuration, isAudioAvailable } from '@/features/field-mode/hooks/useVoiceRecording';
import { transcribeAudio, extractPropertyData, ExtractedPropertyData } from '@/lib/openai';

export interface VoiceCaptureState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isTranscribing: boolean;
  isExtracting: boolean;
  transcript: string | null;
  extractedData: ExtractedPropertyData | null;
  error: string | null;
}

interface UseVoiceCaptureReturn {
  state: VoiceCaptureState;
  startCapture: () => Promise<void>;
  stopCapture: () => Promise<{ transcript: string; extractedData: ExtractedPropertyData } | null>;
  pauseCapture: () => Promise<void>;
  resumeCapture: () => Promise<void>;
  cancelCapture: () => Promise<void>;
  reset: () => void;
  isAvailable: boolean;
  formatDuration: (seconds: number) => string;
}

/**
 * Hook for voice-based property data capture
 *
 * Combines voice recording, transcription, and AI extraction in one flow:
 * 1. Start recording with startCapture()
 * 2. User describes property details verbally
 * 3. Stop recording with stopCapture()
 * 4. Audio is transcribed using Whisper
 * 5. Property data is extracted using GPT-4
 *
 * @example
 * ```typescript
 * const { state, startCapture, stopCapture, isAvailable } = useVoiceCapture();
 *
 * const handleCaptureComplete = async () => {
 *   const result = await stopCapture();
 *   if (result) {
 *     console.log('Transcript:', result.transcript);
 *     console.log('Extracted data:', result.extractedData);
 *     // Pre-fill form with extracted data
 *   }
 * };
 * ```
 */
export function useVoiceCapture(): UseVoiceCaptureReturn {
  const voiceRecording = useVoiceRecording();

  const [state, setState] = useState<VoiceCaptureState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    isTranscribing: false,
    isExtracting: false,
    transcript: null,
    extractedData: null,
    error: null,
  });

  // Sync recording state from voice recording hook
  const syncRecordingState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecording: voiceRecording.state.isRecording,
      isPaused: voiceRecording.state.isPaused,
      duration: voiceRecording.state.duration,
      error: voiceRecording.error,
    }));
  }, [voiceRecording.state, voiceRecording.error]);

  // Start voice capture
  const startCapture = useCallback(async () => {
    setState(prev => ({
      ...prev,
      transcript: null,
      extractedData: null,
      error: null,
    }));

    await voiceRecording.startRecording();
    syncRecordingState();
  }, [voiceRecording, syncRecordingState]);

  // Stop capture and process audio
  const stopCapture = useCallback(async (): Promise<{ transcript: string; extractedData: ExtractedPropertyData } | null> => {
    try {
      // Stop recording and get audio URI
      const audioUri = await voiceRecording.stopRecording();

      if (!audioUri) {
        setState(prev => ({
          ...prev,
          isRecording: false,
          error: 'Failed to get audio recording',
        }));
        return null;
      }

      // Transcribe audio
      setState(prev => ({
        ...prev,
        isRecording: false,
        isTranscribing: true,
      }));

      const transcript = await transcribeAudio(audioUri);

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        isExtracting: true,
        transcript,
      }));

      // Extract property data from transcript
      const extractedData = await extractPropertyData(transcript);

      setState(prev => ({
        ...prev,
        isExtracting: false,
        extractedData,
      }));

      return { transcript, extractedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process audio';
      console.error('[useVoiceCapture] Error:', errorMessage);

      setState(prev => ({
        ...prev,
        isRecording: false,
        isTranscribing: false,
        isExtracting: false,
        error: errorMessage,
      }));

      return null;
    }
  }, [voiceRecording]);

  // Pause capture
  const pauseCapture = useCallback(async () => {
    await voiceRecording.pauseRecording();
    syncRecordingState();
  }, [voiceRecording, syncRecordingState]);

  // Resume capture
  const resumeCapture = useCallback(async () => {
    await voiceRecording.resumeRecording();
    syncRecordingState();
  }, [voiceRecording, syncRecordingState]);

  // Cancel capture
  const cancelCapture = useCallback(async () => {
    await voiceRecording.cancelRecording();
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      isTranscribing: false,
      isExtracting: false,
      transcript: null,
      extractedData: null,
      error: null,
    });
  }, [voiceRecording]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      isTranscribing: false,
      isExtracting: false,
      transcript: null,
      extractedData: null,
      error: null,
    });
  }, []);

  return {
    state: {
      ...state,
      // Override with live values from voice recording hook
      isRecording: voiceRecording.state.isRecording,
      isPaused: voiceRecording.state.isPaused,
      duration: voiceRecording.state.duration,
    },
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    cancelCapture,
    reset,
    isAvailable: isAudioAvailable,
    formatDuration,
  };
}

// Re-export for convenience
export { isAudioAvailable, formatDuration };
