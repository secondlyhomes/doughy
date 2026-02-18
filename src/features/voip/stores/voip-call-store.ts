// src/features/voip/stores/voip-call-store.ts
// Zustand store for managing VoIP call state

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Call,
  CallStatus,
  CallControls,
  TranscriptSegment,
  AISuggestion,
  VoipCallState,
} from '../types';

// ============================================
// Store Interface
// ============================================

interface VoipCallStore extends VoipCallState {
  // Call lifecycle actions
  initiateCall: (phoneNumber: string, contactId?: string) => void;
  setActiveCall: (call: Call) => void;
  updateCallStatus: (status: CallStatus) => void;
  endCall: () => void;

  // Call controls
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleHold: () => void;
  setRecording: (recording: boolean) => void;

  // Transcript and AI
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  clearTranscript: () => void;
  addAISuggestion: (suggestion: AISuggestion) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // Duration
  setDuration: (seconds: number) => void;
  incrementDuration: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Loading states
  setIsInitiating: (loading: boolean) => void;
  setIsConnecting: (loading: boolean) => void;
  setIsLoadingTranscript: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialCallControls: CallControls = {
  isMuted: false,
  isSpeakerOn: false,
  isOnHold: false,
  isRecording: false,
};

const initialState: VoipCallState = {
  activeCall: null,
  callControls: initialCallControls,
  callStatus: null,
  transcript: [],
  aiSuggestions: [],
  duration: 0,
  error: null,
  isInitiating: false,
  isConnecting: false,
  isLoadingTranscript: false,
};

// ============================================
// Store Implementation
// ============================================

export const useVoipCallStore = create<VoipCallStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Call lifecycle
    // Note: This creates a temporary call record with placeholder user_id
    // The real user_id is set when setActiveCall is called with the DB record
    initiateCall: (phoneNumber: string, contactId?: string) => {
      set({
        isInitiating: true,
        callStatus: 'initiating',
        error: null,
        activeCall: {
          id: `temp-${Date.now()}`,
          user_id: 'pending', // Placeholder - real ID set by setActiveCall
          contact_id: contactId,
          direction: 'outbound',
          status: 'initiating',
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        },
      });
    },

    setActiveCall: (call: Call) => {
      set({
        activeCall: call,
        callStatus: call.status,
        isInitiating: false,
      });
    },

    updateCallStatus: (status: CallStatus) => {
      const { activeCall } = get();
      if (activeCall) {
        set({
          callStatus: status,
          activeCall: { ...activeCall, status },
          isConnecting: status === 'connecting',
        });
      }
    },

    endCall: () => {
      const { activeCall } = get();
      if (activeCall) {
        set({
          callStatus: 'ended',
          activeCall: {
            ...activeCall,
            status: 'ended',
            ended_at: new Date().toISOString(),
          },
        });
      }
    },

    // Call controls
    toggleMute: () => {
      set((state) => ({
        callControls: {
          ...state.callControls,
          isMuted: !state.callControls.isMuted,
        },
      }));
    },

    toggleSpeaker: () => {
      set((state) => ({
        callControls: {
          ...state.callControls,
          isSpeakerOn: !state.callControls.isSpeakerOn,
        },
      }));
    },

    toggleHold: () => {
      set((state) => ({
        callControls: {
          ...state.callControls,
          isOnHold: !state.callControls.isOnHold,
        },
      }));
    },

    setRecording: (recording: boolean) => {
      set((state) => ({
        callControls: {
          ...state.callControls,
          isRecording: recording,
        },
      }));
    },

    // Transcript
    addTranscriptSegment: (segment: TranscriptSegment) => {
      set((state) => ({
        transcript: [...state.transcript, segment],
      }));
    },

    clearTranscript: () => {
      set({ transcript: [] });
    },

    // AI Suggestions
    addAISuggestion: (suggestion: AISuggestion) => {
      set((state) => {
        // Deduplicate by ID (both postgres_changes and broadcast may deliver same suggestion)
        if (state.aiSuggestions.some((s) => s.id === suggestion.id)) {
          return state;
        }
        // Keep suggestions - they scroll now, limit to reasonable amount
        const newSuggestions = [...state.aiSuggestions, suggestion].slice(-10);
        return { aiSuggestions: newSuggestions };
      });
    },

    dismissSuggestion: (id: string) => {
      set((state) => ({
        aiSuggestions: state.aiSuggestions.filter((s) => s.id !== id),
      }));
    },

    clearSuggestions: () => {
      set({ aiSuggestions: [] });
    },

    // Duration
    setDuration: (seconds: number) => {
      set({ duration: seconds });
    },

    incrementDuration: () => {
      set((state) => ({ duration: state.duration + 1 }));
    },

    // Error handling
    setError: (error: string | null) => {
      set({ error, isInitiating: false, isConnecting: false });
    },

    clearError: () => {
      set({ error: null });
    },

    // Loading states
    setIsInitiating: (loading: boolean) => {
      set({ isInitiating: loading });
    },

    setIsConnecting: (loading: boolean) => {
      set({ isConnecting: loading });
    },

    setIsLoadingTranscript: (loading: boolean) => {
      set({ isLoadingTranscript: loading });
    },

    // Reset
    reset: () => {
      set(initialState);
    },
  }))
);

// ============================================
// Selectors
// ============================================

export const selectActiveCall = (state: VoipCallStore) => state.activeCall;
export const selectCallStatus = (state: VoipCallStore) => state.callStatus;
export const selectCallControls = (state: VoipCallStore) => state.callControls;
export const selectTranscript = (state: VoipCallStore) => state.transcript;
export const selectAISuggestions = (state: VoipCallStore) => state.aiSuggestions;
export const selectDuration = (state: VoipCallStore) => state.duration;
export const selectIsInCall = (state: VoipCallStore) =>
  state.callStatus === 'connected' || state.callStatus === 'on_hold';
export const selectError = (state: VoipCallStore) => state.error;
