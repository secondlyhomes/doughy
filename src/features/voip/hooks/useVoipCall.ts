// src/features/voip/hooks/useVoipCall.ts
// Hook for managing VoIP calls

import { useCallback, useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useVoipCallStore } from '../stores/voip-call-store';
import {
  fetchTwilioToken,
  createCallRecord,
  updateCallRecord,
  initializeTwilioVoice,
  makeOutboundCall,
  disconnectCall,
  setMute,
  setSpeaker,
  setHold,
  registerCallEventListeners,
  isValidPhoneNumber,
  isTwilioAvailable,
} from '../services/twilioService';
import type { SubscriptionTier, Call } from '../types';
import { VOIP_FEATURES_BY_TIER } from '../types';
import { isVoipDevMode, VOIP_CONFIG } from '../config';

interface UseVoipCallOptions {
  subscriptionTier?: SubscriptionTier;
}

export function useVoipCall(options: UseVoipCallOptions = {}) {
  const { subscriptionTier = 'free' } = options;
  const router = useRouter();

  const {
    activeCall,
    callStatus,
    callControls,
    isInitiating,
    error,
    initiateCall,
    setActiveCall,
    updateCallStatus,
    endCall: storeEndCall,
    toggleMute: storeToggleMute,
    toggleSpeaker: storeToggleSpeaker,
    toggleHold: storeToggleHold,
    setError,
    reset,
  } = useVoipCallStore();

  const features = VOIP_FEATURES_BY_TIER[subscriptionTier];
  const eventListenerCleanup = useRef<(() => void) | null>(null);

  // Use ref to access latest activeCall in event listeners (avoids stale closure)
  const activeCallRef = useRef<Call | null>(activeCall);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Initialize Twilio when component mounts
  useEffect(() => {
    if (!features.inAppCalling) return;

    const initTwilio = async () => {
      try {
        // In dev mode, skip real Twilio initialization
        if (isVoipDevMode()) {
          console.log('[DEV] Skipping Twilio token fetch - using mock mode');
          initializeTwilioVoice('dev-mock-token');
        } else {
          const { token } = await fetchTwilioToken();
          initializeTwilioVoice(token);
        }

        // Register event listeners - use refs to avoid stale closures
        eventListenerCleanup.current = registerCallEventListeners({
          onConnected: (callSid) => {
            updateCallStatus('connected');
            const currentCall = activeCallRef.current;
            // Background DB update - intentionally silent on failure as the call is already working.
            // Failures are logged for debugging but don't interrupt the user during an active call.
            // TODO: Consider queueing failed updates for retry or reporting to error tracking (Sentry).
            if (currentCall && !isVoipDevMode()) {
              updateCallRecord(currentCall.id, {
                twilio_call_sid: callSid,
                status: 'connected',
                started_at: new Date().toISOString(),
              }).catch((err) => {
                if (__DEV__) console.error('Failed to update call record on connect:', err);
                // Non-critical: call works regardless of DB update success
              });
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onDisconnected: (callSid, err) => {
            updateCallStatus('ended');
            const currentCall = activeCallRef.current;
            // Background DB update - intentionally silent on failure to avoid interrupting post-call flow.
            // TODO: Consider showing subtle notification or retry mechanism for production.
            if (currentCall && !isVoipDevMode()) {
              updateCallRecord(currentCall.id, {
                status: err ? 'failed' : 'ended',
                ended_at: new Date().toISOString(),
              }).catch((updateErr) => {
                if (__DEV__) console.error('Failed to update call record on disconnect:', updateErr);
                // Non-critical: call metadata may be incomplete but doesn't affect user experience
              });
            }
            if (err) {
              setError(err.message);
            }
          },
          onRinging: () => {
            updateCallStatus('ringing');
          },
          onConnectFailure: (err) => {
            updateCallStatus('failed');
            setError(err.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
          onReconnecting: () => {
            updateCallStatus('connecting');
          },
          onReconnected: () => {
            updateCallStatus('connected');
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize VoIP';
        console.error('Failed to initialize Twilio:', err);
        // Don't show alert in dev mode - just log it
        if (!isVoipDevMode()) {
          setError(errorMessage);
          Alert.alert('VoIP Error', 'Failed to initialize calling service. Please try again later.');
        }
      }
    };

    initTwilio();

    return () => {
      if (eventListenerCleanup.current) {
        eventListenerCleanup.current();
      }
    };
  }, [features.inAppCalling, updateCallStatus, setError]);

  /**
   * Start a call - opens native dialer for free users, in-app call for pro/premium
   */
  const startCall = useCallback(
    async (phoneNumber: string, contactId?: string, contactName?: string) => {
      if (!isValidPhoneNumber(phoneNumber)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
        return;
      }

      // Free users get native dialer
      if (!features.inAppCalling) {
        const url = `tel:${phoneNumber}`;
        const canOpen = await Linking.canOpenURL(url);

        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Unable to Call', 'Phone calling is not available on this device.');
        }
        return;
      }

      // Pro/Premium users get in-app calling
      try {
        if (__DEV__) console.log('[VOIP DEBUG] Starting in-app call to:', phoneNumber);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Create call record first (skip in dev mode)
        initiateCall(phoneNumber, contactId);
        if (__DEV__) console.log('[VOIP DEBUG] Call initiated in store');

        if (isVoipDevMode()) {
          // Dev mode: use mock call record
          if (__DEV__) console.log('[VOIP DEBUG] Dev mode detected, using mock call record');
          const mockCallRecord = {
            id: `dev-call-${Date.now()}`,
            user_id: 'dev-user',
            contact_id: contactId,
            direction: 'outbound' as const,
            status: 'initiating' as const,
            phone_number: phoneNumber,
            created_at: new Date().toISOString(),
          };
          setActiveCall(mockCallRecord);
        } else {
          const callRecord = await createCallRecord({
            phoneNumber,
            direction: 'outbound',
            contactId,
          });
          setActiveCall(callRecord);
        }

        // Navigate to in-call screen
        if (__DEV__) console.log('[VOIP DEBUG] Navigating to call screen...');
        router.push({
          pathname: '/(modals)/call',
          params: {
            phoneNumber,
            contactId,
            contactName: contactName || phoneNumber,
          },
        } as any); // Type assertion needed for expo-router dynamic routes

        // Make the actual call (simulated in dev mode)
        if (__DEV__) console.log('[VOIP DEBUG] Calling makeOutboundCall...');
        makeOutboundCall({
          to: phoneNumber,
          contactId,
        });
        if (__DEV__) console.log('[VOIP DEBUG] makeOutboundCall completed');
      } catch (err) {
        if (__DEV__) console.error('Failed to start call:', err);
        setError(err instanceof Error ? err.message : 'Failed to start call');
        reset();
      }
    },
    [features.inAppCalling, initiateCall, setActiveCall, router, setError, reset]
  );

  /**
   * End the current call
   * Note: disconnectCall() triggers onDisconnected callback which handles status update.
   * In dev mode, this happens synchronously. In prod, it's async via Twilio SDK.
   * We call storeEndCall() as a fallback to ensure UI updates immediately.
   */
  const endCall = useCallback(async () => {
    const currentCall = activeCallRef.current;
    if (!currentCall) return;

    try {
      // Disconnect the call - this triggers onDisconnected callback
      disconnectCall();
      // Update store immediately for responsive UI (idempotent if already ended)
      storeEndCall();

      // Background DB update - intentionally silent on failure as the call has already ended locally.
      // The user can still see call history; record may show incorrect end state.
      // TODO: Consider queueing failed updates for retry in production.
      if (!isVoipDevMode()) {
        await updateCallRecord(currentCall.id, {
          status: 'ended',
          ended_at: new Date().toISOString(),
        });
      } else {
        if (__DEV__) console.log('[DEV] Call ended - skipping DB update');
      }
    } catch (err) {
      // Non-critical: call ended locally, DB record may be incomplete
      if (__DEV__) console.error('Failed to update call record after ending:', err);
    }
  }, [storeEndCall]);

  /**
   * Toggle mute
   * Guarded against Twilio SDK not being integrated in production.
   */
  const toggleMute = useCallback(() => {
    // Guard: In production without Twilio SDK, setMute throws - catch to prevent crash
    if (!isTwilioAvailable() && !isVoipDevMode()) {
      setError('Call controls unavailable');
      return;
    }
    try {
      const newMuted = !callControls.isMuted;
      setMute(newMuted);
      storeToggleMute();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      if (__DEV__) console.error('Failed to toggle mute:', err);
      setError('Failed to mute call');
    }
  }, [callControls.isMuted, storeToggleMute, setError]);

  /**
   * Toggle speaker
   * Guarded against Twilio SDK not being integrated in production.
   */
  const toggleSpeaker = useCallback(() => {
    if (!isTwilioAvailable() && !isVoipDevMode()) {
      setError('Call controls unavailable');
      return;
    }
    try {
      const newSpeaker = !callControls.isSpeakerOn;
      setSpeaker(newSpeaker);
      storeToggleSpeaker();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      if (__DEV__) console.error('Failed to toggle speaker:', err);
      setError('Failed to toggle speaker');
    }
  }, [callControls.isSpeakerOn, storeToggleSpeaker, setError]);

  /**
   * Toggle hold
   * Guarded against Twilio SDK not being integrated in production.
   */
  const toggleHold = useCallback(() => {
    if (!isTwilioAvailable() && !isVoipDevMode()) {
      setError('Call controls unavailable');
      return;
    }
    try {
      const newHold = !callControls.isOnHold;
      setHold(newHold);
      storeToggleHold();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      if (__DEV__) console.error('Failed to toggle hold:', err);
      setError('Failed to put call on hold');
    }
  }, [callControls.isOnHold, storeToggleHold, setError]);

  /**
   * Check if user can make in-app calls
   */
  const canMakeInAppCall = features.inAppCalling;

  /**
   * Get upgrade prompt message
   */
  const getUpgradePrompt = useCallback((): string | null => {
    if (subscriptionTier === 'free') {
      return 'Upgrade to Pro for in-app calling with recording and transcription.';
    }
    if (subscriptionTier === 'pro') {
      return 'Upgrade to Premium for real-time AI coaching during calls.';
    }
    return null;
  }, [subscriptionTier]);

  return {
    // State
    activeCall,
    callStatus,
    callControls,
    isInitiating,
    error,
    features,

    // Actions
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleHold,
    reset,

    // Helpers
    canMakeInAppCall,
    getUpgradePrompt,
  };
}

export default useVoipCall;
