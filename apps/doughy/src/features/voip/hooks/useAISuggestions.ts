// src/features/voip/hooks/useAISuggestions.ts
// Hook for subscribing to AI suggestions during calls (Premium feature)

import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useVoipCallStore } from '../stores/voip-call-store';
import type { AISuggestion, SubscriptionTier } from '../types';
import { VOIP_FEATURES_BY_TIER } from '../types';

interface UseAISuggestionsOptions {
  callId: string | null;
  subscriptionTier?: SubscriptionTier;
  contactContext?: {
    name?: string;
    company?: string;
    previousInteractions?: number;
    notes?: string;
  };
}

export function useAISuggestions({
  callId,
  subscriptionTier = 'free',
  contactContext,
}: UseAISuggestionsOptions) {
  const {
    aiSuggestions,
    addAISuggestion,
    dismissSuggestion,
    clearSuggestions,
  } = useVoipCallStore();

  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Track if context has been sent for this call to prevent duplicate sends
  const contextSentForCallRef = useRef<string | null>(null);

  const features = VOIP_FEATURES_BY_TIER[subscriptionTier];
  const enabled = features.realtimeAISuggestions && !!callId;

  // Subscribe to real-time AI suggestions
  useEffect(() => {
    if (!enabled || !callId) return;

    setSubscriptionError(null);

    // Subscribe to AI suggestion updates from the backend
    // The call-ai-coach Edge Function will analyze the transcript
    // and push suggestions via Supabase Realtime
    const channel = supabase
      .channel(`call-ai-${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_ai_suggestions',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          const suggestion: AISuggestion = {
            id: payload.new.id,
            type: payload.new.type,
            text: payload.new.text,
            confidence: payload.new.confidence,
            context: payload.new.context,
            timestamp: new Date(payload.new.created_at).getTime(),
          };
          addAISuggestion(suggestion);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const errorMessage = err?.message || 'Failed to subscribe to AI suggestions';
          setSubscriptionError(errorMessage);
          console.error('AI suggestions subscription error:', err);
        }
      });

    // Also subscribe to broadcast channel for faster delivery
    // (Postgres changes have some latency)
    const broadcastChannel = supabase
      .channel(`call-ai-broadcast-${callId}`)
      .on('broadcast', { event: 'ai-suggestion' }, (payload) => {
        const suggestion = payload.payload as AISuggestion;
        addAISuggestion(suggestion);
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // This is acceptable degradation - postgres_changes still works for delivery
          console.warn('AI suggestions broadcast channel failed, falling back to postgres changes only:', err);
        }
      });

    return () => {
      setIsSubscribed(false);
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [enabled, callId, addAISuggestion]);

  // Clear suggestions when call changes
  useEffect(() => {
    if (!callId) {
      clearSuggestions();
    }
  }, [callId, clearSuggestions]);

  // Send contact context to AI coach when call starts
  // Uses ref to prevent re-sending if contactContext object reference changes
  useEffect(() => {
    if (!enabled || !callId || !contactContext) return;

    // Only send context once per call
    if (contextSentForCallRef.current === callId) return;
    contextSentForCallRef.current = callId;

    // Invoke the AI coach with contact context
    supabase.functions
      .invoke('call-ai-coach', {
        body: {
          call_id: callId,
          action: 'set_context',
          context: contactContext,
        },
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to set AI coach context:', error);
          // Don't alert user - AI suggestions are a nice-to-have, not critical
        }
      })
      .catch((err) => {
        console.error('Failed to invoke AI coach:', err);
      });
  }, [enabled, callId, contactContext]);

  // Reset context sent ref when callId changes (new call)
  useEffect(() => {
    if (!callId) {
      contextSentForCallRef.current = null;
    }
  }, [callId]);

  /**
   * Request a specific type of suggestion
   */
  const requestSuggestion = useCallback(
    async (type: AISuggestion['type'], context?: string): Promise<boolean> => {
      if (!enabled || !callId) return false;

      try {
        const { error } = await supabase.functions.invoke('call-ai-coach', {
          body: {
            call_id: callId,
            action: 'request_suggestion',
            suggestion_type: type,
            context,
          },
        });

        if (error) {
          console.error('Failed to request AI suggestion:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Failed to request AI suggestion:', err);
        return false;
      }
    },
    [enabled, callId]
  );

  /**
   * Provide feedback on a suggestion (for ML improvement)
   */
  const provideFeedback = useCallback(
    async (suggestionId: string, helpful: boolean): Promise<boolean> => {
      if (!callId) return false;

      try {
        const { error } = await supabase
          .from('call_ai_suggestions')
          .update({ was_helpful: helpful })
          .eq('id', suggestionId);

        if (error) {
          console.error('Failed to provide suggestion feedback:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Failed to provide suggestion feedback:', err);
        return false;
      }
    },
    [callId]
  );

  return {
    suggestions: aiSuggestions,
    dismissSuggestion,
    clearSuggestions,
    requestSuggestion,
    provideFeedback,
    isEnabled: enabled,
    isSubscribed,
    subscriptionError,
  };
}

export default useAISuggestions;
