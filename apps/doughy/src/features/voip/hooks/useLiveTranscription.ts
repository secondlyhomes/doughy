// src/features/voip/hooks/useLiveTranscription.ts
// Hook for subscribing to live transcription during calls

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useVoipCallStore } from '../stores/voip-call-store';
import type { TranscriptSegment } from '../types';

interface UseLiveTranscriptionOptions {
  callId: string | null;
  enabled?: boolean;
}

export function useLiveTranscription({
  callId,
  enabled = true,
}: UseLiveTranscriptionOptions) {
  const {
    transcript,
    addTranscriptSegment,
    clearTranscript,
    setIsLoadingTranscript,
  } = useVoipCallStore();

  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Subscribe to real-time transcription updates
  useEffect(() => {
    if (!callId || !enabled) return;

    setIsLoadingTranscript(true);
    setSubscriptionError(null);

    // Subscribe to Supabase Realtime for transcription updates
    // The transcription webhook will insert rows into a call_transcripts table
    // which we listen to here
    const channel = supabase
      .channel(`call-transcript-${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_transcript_segments',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          const segment: TranscriptSegment = {
            id: payload.new.id,
            speaker: payload.new.speaker,
            text: payload.new.text,
            timestamp: payload.new.timestamp_ms,
            confidence: payload.new.confidence,
          };
          addTranscriptSegment(segment);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsLoadingTranscript(false);
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const errorMessage = err?.message || 'Failed to subscribe to transcription';
          setSubscriptionError(errorMessage);
          setIsLoadingTranscript(false);
          console.error('Transcription subscription error:', err);
        }
      });

    return () => {
      setIsSubscribed(false);
      supabase.removeChannel(channel);
    };
  }, [callId, enabled, addTranscriptSegment, setIsLoadingTranscript]);

  // Clear transcript when call changes
  useEffect(() => {
    if (!callId) {
      clearTranscript();
    }
  }, [callId, clearTranscript]);

  /**
   * Manually add a transcript segment (for testing or manual input)
   */
  const addSegment = useCallback(
    (speaker: 'user' | 'contact', text: string) => {
      const segment: TranscriptSegment = {
        id: `manual-${Date.now()}`,
        speaker,
        text,
        timestamp: Date.now(),
        confidence: 1.0,
      };
      addTranscriptSegment(segment);
    },
    [addTranscriptSegment]
  );

  return {
    transcript,
    addSegment,
    clearTranscript,
    isSubscribed,
    subscriptionError,
  };
}

export default useLiveTranscription;
