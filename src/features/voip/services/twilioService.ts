// src/features/voip/services/twilioService.ts
// Twilio Voice SDK wrapper for React Native
// Note: Requires @twilio/voice-react-native-sdk installed in the project

import { supabase } from '@/lib/supabase';
import type { Call, CallStatus } from '../types';

// ============================================
// Types
// ============================================

interface TwilioCallOptions {
  to: string;
  from?: string;
  contactId?: string;
}

interface TwilioTokenResponse {
  token: string;
  identity: string;
}

interface CallRecordResponse {
  call: Call;
}

// ============================================
// Token Management
// ============================================

/**
 * Fetch a Twilio access token from our backend
 */
export async function fetchTwilioToken(): Promise<TwilioTokenResponse> {
  const { data, error } = await supabase.functions.invoke('voice-token', {
    method: 'POST',
  });

  if (error) {
    console.error('Failed to fetch Twilio token:', error);
    throw new Error('Failed to get call access token');
  }

  return data as TwilioTokenResponse;
}

// ============================================
// Call Management
// ============================================

/**
 * Create a call record in the database
 */
export async function createCallRecord(options: {
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  contactId?: string;
}): Promise<Call> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('calls')
    .insert({
      user_id: user.id,
      phone_number: options.phoneNumber,
      direction: options.direction,
      contact_id: options.contactId,
      status: 'initiating',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create call record:', error);
    throw new Error('Failed to initiate call');
  }

  return data;
}

/**
 * Update call record with Twilio SID and status
 */
export async function updateCallRecord(
  callId: string,
  updates: {
    twilio_call_sid?: string;
    status?: CallStatus;
    started_at?: string;
    ended_at?: string;
    duration_seconds?: number;
    recording_url?: string;
  }
): Promise<Call> {
  const { data, error } = await supabase
    .from('calls')
    .update(updates)
    .eq('id', callId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update call record:', error);
    throw new Error('Failed to update call');
  }

  return data;
}

/**
 * Get call by Twilio SID (for webhook correlation)
 */
export async function getCallByTwilioSid(twilioSid: string): Promise<Call | null> {
  const { data, error } = await supabase
    .from('calls')
    .select()
    .eq('twilio_call_sid', twilioSid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Failed to get call:', error);
    throw error;
  }

  return data;
}

/**
 * Get recent calls for user
 * Uses RPC function for cross-schema join with contacts
 */
export async function getRecentCalls(limit = 20): Promise<Call[]> {
  const { getRecentCalls: getRecentCallsRPC, mapCallRPC } = await import('@/lib/rpc');

  try {
    const data = await getRecentCallsRPC(limit);
    return data.map(mapCallRPC) as Call[];
  } catch (error) {
    console.error('Failed to get recent calls:', error);
    throw error;
  }
}

// ============================================
// Twilio Voice SDK Integration
// ============================================

// Flag to track if Twilio SDK is integrated
// Set to true when @twilio/voice-react-native-sdk is installed and configured
const TWILIO_SDK_INTEGRATED = false;

class TwilioNotIntegratedError extends Error {
  constructor(operation: string) {
    super(
      `Twilio Voice SDK not yet integrated. Cannot ${operation}. ` +
      'Install @twilio/voice-react-native-sdk and set TWILIO_SDK_INTEGRATED = true.'
    );
    this.name = 'TwilioNotIntegratedError';
  }
}

/**
 * Check if Twilio SDK is available
 */
export function isTwilioAvailable(): boolean {
  return TWILIO_SDK_INTEGRATED;
}

/**
 * Initialize Twilio Voice with access token
 * Call this before making/receiving calls
 */
export function initializeTwilioVoice(token: string): void {
  if (!TWILIO_SDK_INTEGRATED) {
    // In development, log and simulate success
    if (__DEV__) {
      console.log('[DEV] Twilio Voice initialized with token (simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('initialize VoIP');
  }
  // TwilioVoice.connect(token);
}

/**
 * Make an outbound call
 */
export function makeOutboundCall(options: TwilioCallOptions): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Making outbound call to:', options.to, '(simulated)');
      // Trigger the call simulation
      triggerDevModeCallSimulation();
      return;
    }
    throw new TwilioNotIntegratedError('make outbound call');
  }
  // TwilioVoice.connect({
  //   accessToken: token,
  //   params: { To: options.to, From: options.from },
  // });
}

/**
 * Accept incoming call
 */
export function acceptIncomingCall(): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Accepting incoming call (simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('accept incoming call');
  }
  // TwilioVoice.accept();
}

/**
 * Reject incoming call
 */
export function rejectIncomingCall(): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Rejecting incoming call (simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('reject incoming call');
  }
  // TwilioVoice.reject();
}

/**
 * Disconnect active call
 */
export function disconnectCall(): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Disconnecting call (simulated)');
      // Clear any pending simulation timers
      devModeSimulationTimers.forEach(clearTimeout);
      devModeSimulationTimers = [];
      // Trigger disconnect event
      devModeListeners?.onDisconnected?.(`dev-call-${Date.now()}`);
      return;
    }
    throw new TwilioNotIntegratedError('disconnect call');
  }
  // TwilioVoice.disconnect();
}

/**
 * Toggle mute
 */
export function setMute(muted: boolean): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Set mute:', muted, '(simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('set mute');
  }
  // TwilioVoice.setMuted(muted);
}

/**
 * Toggle speaker
 */
export function setSpeaker(enabled: boolean): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Set speaker:', enabled, '(simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('set speaker');
  }
  // TwilioVoice.toggleSpeaker(enabled);
}

/**
 * Hold call
 */
export function setHold(held: boolean): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Set hold:', held, '(simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('set hold');
  }
  // TwilioVoice.hold(held);
}

/**
 * Send DTMF digits
 */
export function sendDigits(digits: string): void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Sending DTMF:', digits, '(simulated)');
      return;
    }
    throw new TwilioNotIntegratedError('send DTMF digits');
  }
  // TwilioVoice.sendDigits(digits);
}

// ============================================
// Event Listeners
// ============================================

export type CallEventListener = {
  onConnected: (callSid: string) => void;
  onDisconnected: (callSid: string, error?: Error) => void;
  onRinging: () => void;
  onConnectFailure: (error: Error) => void;
  onReconnecting: (error: Error) => void;
  onReconnected: () => void;
};

// Store listeners for dev mode simulation
let devModeListeners: Partial<CallEventListener> | null = null;
let devModeSimulationTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * Register event listeners for call events
 */
export function registerCallEventListeners(listeners: Partial<CallEventListener>): () => void {
  if (!TWILIO_SDK_INTEGRATED) {
    if (__DEV__) {
      console.log('[DEV] Registered call event listeners (stored for simulation)');
      // Store listeners - simulation will be triggered by makeOutboundCall
      devModeListeners = listeners;
      return () => {
        console.log('[DEV] Unregistered call event listeners');
        devModeListeners = null;
        // Clear any pending simulation timers
        devModeSimulationTimers.forEach(clearTimeout);
        devModeSimulationTimers = [];
      };
    }
    throw new TwilioNotIntegratedError('register call event listeners');
  }
  // const subscriptions = [
  //   TwilioVoice.addEventListener('callConnected', listeners.onConnected),
  //   TwilioVoice.addEventListener('callDisconnected', listeners.onDisconnected),
  //   // ... etc
  // ];
  // return () => subscriptions.forEach(sub => sub.remove());
  return () => {};
}

/**
 * Trigger dev mode call simulation (called by makeOutboundCall)
 */
function triggerDevModeCallSimulation() {
  if (!devModeListeners) {
    console.log('[DEV] No listeners registered, skipping simulation');
    return;
  }

  // Clear any existing simulation timers
  devModeSimulationTimers.forEach(clearTimeout);
  devModeSimulationTimers = [];

  console.log('[DEV] Starting call simulation...');

  // Simulate ringing after 500ms
  const ringTimer = setTimeout(() => {
    console.log('[DEV] Simulating: Ringing...');
    devModeListeners?.onRinging?.();
  }, 500);
  devModeSimulationTimers.push(ringTimer);

  // Simulate connected after 2500ms
  const connectTimer = setTimeout(() => {
    console.log('[DEV] Simulating: Connected!');
    devModeListeners?.onConnected?.(`dev-call-${Date.now()}`);
  }, 2500);
  devModeSimulationTimers.push(connectTimer);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for international
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if format unknown
  return phone;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}
