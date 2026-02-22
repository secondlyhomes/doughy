// src/features/voip/types/index.ts
// VoIP feature type definitions

export type CallDirection = 'inbound' | 'outbound';

export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'on_hold'
  | 'ended'
  | 'failed'
  | 'busy'
  | 'no_answer';

export interface Call {
  id: string;
  user_id: string;
  contact_id?: string;
  twilio_call_sid?: string;
  direction: CallDirection;
  status: CallStatus;
  phone_number: string;
  duration_seconds?: number;
  recording_url?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CallSummary {
  id: string;
  call_id: string;
  full_transcript?: string;
  summary?: string;
  key_points?: string[];
  action_items?: ActionItem[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  due_date?: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: 'user' | 'contact';
  text: string;
  timestamp: number;
  confidence?: number;
}

export interface AISuggestion {
  id: string;
  type: 'response' | 'question' | 'action' | 'info';
  text: string;
  confidence: number;
  context?: string;
  timestamp: number;
}

export interface CallWithSummary extends Call {
  summary?: CallSummary;
  contact?: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
}

export interface CallControls {
  isMuted: boolean;
  isSpeakerOn: boolean;
  isOnHold: boolean;
  isRecording: boolean;
}

export interface VoipCallState {
  // Current call state
  activeCall: Call | null;
  callControls: CallControls;
  callStatus: CallStatus | null;

  // Live data during call
  transcript: TranscriptSegment[];
  aiSuggestions: AISuggestion[];
  duration: number;

  // Error handling
  error: string | null;

  // Loading states
  isInitiating: boolean;
  isConnecting: boolean;
  isLoadingTranscript: boolean;
}

// Feature tier gating
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface VoipFeatures {
  inAppCalling: boolean;
  recording: boolean;
  transcription: boolean;
  postCallSummary: boolean;
  realtimeAISuggestions: boolean;
}

export const VOIP_FEATURES_BY_TIER: Record<SubscriptionTier, VoipFeatures> = {
  free: {
    inAppCalling: false,
    recording: false,
    transcription: false,
    postCallSummary: false,
    realtimeAISuggestions: false,
  },
  pro: {
    inAppCalling: true,
    recording: true,
    transcription: true,
    postCallSummary: true,
    realtimeAISuggestions: false,
  },
  premium: {
    inAppCalling: true,
    recording: true,
    transcription: true,
    postCallSummary: true,
    realtimeAISuggestions: true,
  },
};
