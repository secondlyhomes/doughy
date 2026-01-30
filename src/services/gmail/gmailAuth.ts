/**
 * Gmail OAuth Authentication Service
 *
 * Handles the OAuth 2.0 flow for connecting Gmail accounts to MoltBot.
 * Uses expo-auth-session for the OAuth flow on mobile.
 *
 * Setup Required:
 * 1. Create a Google Cloud project at https://console.cloud.google.com
 * 2. Enable Gmail API
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

// Gmail read-only scope - we only need to read emails, not modify them
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Get client ID from environment
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// =============================================================================
// Types
// =============================================================================

export interface GmailAuthResult {
  success: boolean;
  email?: string;
  error?: string;
  connectionId?: string;
}

export interface GmailConnection {
  id: string;
  provider: 'gmail';
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  detected_platforms: string[];
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
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
// Gmail Auth Service
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
 * Check if Gmail OAuth is configured
 */
export function isGmailAuthConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

/**
 * Start the Gmail OAuth flow
 * Returns a prompt function that opens the OAuth consent screen
 */
export function useGmailAuth() {
  const redirectUri = getRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: GMAIL_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: 'offline', // Request refresh token
        prompt: 'consent', // Force consent to get refresh token
      },
    },
    discovery
  );

  return {
    request,
    response,
    promptAsync,
    redirectUri,
  };
}

/**
 * Exchange authorization code for tokens and save to database
 * This should be called after receiving the OAuth callback
 */
export async function handleGmailAuthCallback(
  code: string,
  codeVerifier: string
): Promise<GmailAuthResult> {
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
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to connect Gmail' };
    }

    return {
      success: true,
      email: result.email,
      connectionId: result.connectionId,
    };
  } catch (error) {
    console.error('[GmailAuth] Callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the current Gmail connection for the user's workspace
 */
export async function getGmailConnection(): Promise<GmailConnection | null> {
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

    return data as GmailConnection;
  } catch (error) {
    console.error('[GmailAuth] Error fetching connection:', error);
    return null;
  }
}

/**
 * Disconnect Gmail (revoke access and delete connection)
 */
export async function disconnectGmail(connectionId: string): Promise<boolean> {
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
    console.error('[GmailAuth] Disconnect error:', error);
    return false;
  }
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
    console.error('[GmailAuth] Sync error:', error);
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
