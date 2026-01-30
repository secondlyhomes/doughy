/**
 * Google OAuth Authentication Service
 *
 * Handles the unified OAuth 2.0 flow for connecting Google services (Gmail, Calendar).
 * Uses expo-auth-session for the OAuth flow on mobile.
 *
 * This service consolidates Gmail and Calendar OAuth into a single flow,
 * requesting all needed scopes upfront so users only authenticate once.
 *
 * Setup Required:
 * 1. Create a Google Cloud project at https://console.cloud.google.com
 * 2. Enable Gmail API and Google Calendar API
 * 3. Create OAuth 2.0 credentials (Web application type for Expo)
 * 4. Add authorized redirect URIs for your Expo app
 * 5. Set environment variables:
 *    - EXPO_PUBLIC_GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET (in Supabase Edge Function secrets)
 *
 * @see https://docs.expo.dev/guides/google-authentication/
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// =============================================================================
// Constants
// =============================================================================

// Google OAuth endpoints
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/**
 * Google OAuth scopes for different services
 */
export const GOOGLE_SCOPES = {
  gmail: {
    readonly: 'https://www.googleapis.com/auth/gmail.readonly',
    send: 'https://www.googleapis.com/auth/gmail.send',
  },
  calendar: {
    readonly: 'https://www.googleapis.com/auth/calendar.readonly',
    events: 'https://www.googleapis.com/auth/calendar.events',
  },
  userinfo: {
    email: 'https://www.googleapis.com/auth/userinfo.email',
  },
} as const;

/**
 * Available Google service types
 */
export type GoogleServiceType = 'gmail' | 'calendar';

/**
 * Default scopes for unified OAuth (Gmail + Calendar)
 * Requests both Gmail and Calendar access in one consent flow
 */
const DEFAULT_SCOPES = [
  GOOGLE_SCOPES.gmail.readonly,
  GOOGLE_SCOPES.gmail.send,
  GOOGLE_SCOPES.calendar.events,
  GOOGLE_SCOPES.userinfo.email,
];

/**
 * Scopes for Gmail-only OAuth (backward compatibility)
 */
const GMAIL_ONLY_SCOPES = [
  GOOGLE_SCOPES.gmail.readonly,
  GOOGLE_SCOPES.userinfo.email,
];

// Get client ID from environment
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// =============================================================================
// Types
// =============================================================================

export interface GoogleAuthResult {
  success: boolean;
  email?: string;
  error?: string;
  connectionId?: string;
  services?: GoogleServiceType[];
}

export interface GoogleConnection {
  id: string;
  provider: 'gmail';
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  detected_platforms: string[];
  google_services: GoogleServiceType[];
  google_calendar_id: string | null;
  last_calendar_sync_at: string | null;
  created_at: string;
}

export interface GoogleAuthOptions {
  /** Which services to request access for */
  services?: GoogleServiceType[];
  /** Force re-consent even if already authorized */
  forceConsent?: boolean;
}

// =============================================================================
// OAuth Discovery
// =============================================================================

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: GOOGLE_AUTH_ENDPOINT,
  tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
  revocationEndpoint: GOOGLE_REVOKE_ENDPOINT,
};

// =============================================================================
// Google Auth Service
// =============================================================================

/**
 * Get the redirect URI for OAuth callback
 */
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'doughy',
    path: 'gmail-callback',
  });
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

/**
 * Get the appropriate scopes based on requested services
 */
function getScopesForServices(services: GoogleServiceType[]): string[] {
  const scopes: string[] = [GOOGLE_SCOPES.userinfo.email];

  if (services.includes('gmail')) {
    scopes.push(GOOGLE_SCOPES.gmail.readonly);
    scopes.push(GOOGLE_SCOPES.gmail.send);
  }

  if (services.includes('calendar')) {
    scopes.push(GOOGLE_SCOPES.calendar.events);
  }

  return scopes;
}

/**
 * Start the Google OAuth flow
 * Returns a prompt function that opens the OAuth consent screen
 *
 * @param options - Configuration options for the OAuth flow
 */
export function useGoogleAuth(options: GoogleAuthOptions = {}) {
  const { services = ['gmail', 'calendar'], forceConsent = false } = options;
  const redirectUri = getRedirectUri();
  const scopes = getScopesForServices(services);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: 'offline', // Request refresh token
        prompt: forceConsent ? 'consent' : 'consent', // Force consent to get refresh token
      },
    },
    discovery
  );

  return {
    request,
    response,
    promptAsync,
    redirectUri,
    services,
  };
}

/**
 * Legacy hook for Gmail-only OAuth (backward compatibility)
 * @deprecated Use useGoogleAuth({ services: ['gmail'] }) instead
 */
export function useGmailAuth() {
  return useGoogleAuth({ services: ['gmail'] });
}

/**
 * Exchange authorization code for tokens and save to database
 * This should be called after receiving the OAuth callback
 *
 * @param code - Authorization code from OAuth callback
 * @param codeVerifier - PKCE code verifier
 * @param services - Which services were requested
 */
export async function handleGoogleAuthCallback(
  code: string,
  codeVerifier: string,
  services: GoogleServiceType[] = ['gmail', 'calendar']
): Promise<GoogleAuthResult> {
  try {
    const redirectUri = getRedirectUri();

    // Exchange code for tokens via our edge function
    // (We use an edge function to keep the client secret secure)
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/gmail-oauth-callback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          code,
          codeVerifier,
          redirectUri,
          services, // Pass requested services to edge function
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to connect Google account' };
    }

    return {
      success: true,
      email: result.email,
      connectionId: result.connectionId,
      services: result.services || services,
    };
  } catch (error) {
    console.error('[GoogleAuth] Callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Legacy callback handler for Gmail-only OAuth
 * @deprecated Use handleGoogleAuthCallback instead
 */
export async function handleGmailAuthCallback(
  code: string,
  codeVerifier: string
): Promise<GoogleAuthResult> {
  return handleGoogleAuthCallback(code, codeVerifier, ['gmail']);
}

/**
 * Get the current Google connection for the user's workspace
 */
export async function getGoogleConnection(): Promise<GoogleConnection | null> {
  try {
    const { data, error } = await supabase
      .from('rental_email_connections')
      .select('*')
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found
        return null;
      }
      throw error;
    }

    return data as GoogleConnection;
  } catch (error) {
    console.error('[GoogleAuth] Error fetching connection:', error);
    return null;
  }
}

/**
 * Legacy function for Gmail connection
 * @deprecated Use getGoogleConnection instead
 */
export async function getGmailConnection(): Promise<GoogleConnection | null> {
  return getGoogleConnection();
}

/**
 * Check if a specific Google service is enabled for the connection
 */
export async function isServiceEnabled(service: GoogleServiceType): Promise<boolean> {
  const connection = await getGoogleConnection();
  if (!connection) return false;
  return connection.google_services?.includes(service) ?? false;
}

/**
 * Disconnect Google account (revoke access and delete connection)
 */
export async function disconnectGoogle(connectionId: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call edge function to revoke token and delete connection
    const response = await fetch(
      `${supabaseUrl}/functions/v1/gmail-disconnect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ connectionId }),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('[GoogleAuth] Disconnect error:', error);
    return false;
  }
}

/**
 * Legacy function for Gmail disconnect
 * @deprecated Use disconnectGoogle instead
 */
export async function disconnectGmail(connectionId: string): Promise<boolean> {
  return disconnectGoogle(connectionId);
}

/**
 * Trigger a manual sync of Gmail inbox
 */
export async function triggerGmailSync(connectionId: string): Promise<{
  success: boolean;
  newMessages?: number;
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/gmail-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          connectionId,
          manual: true,
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      newMessages: result.newMessages || 0,
    };
  } catch (error) {
    console.error('[GoogleAuth] Sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format the last sync time for display
 */
export function formatLastSyncTime(lastSyncAt: string | null): string {
  if (!lastSyncAt) {
    return 'Never synced';
  }

  const syncDate = new Date(lastSyncAt);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
