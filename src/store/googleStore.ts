// src/store/googleStore.ts
// Google integration store for React Native with proper mobile OAuth
import { create } from 'zustand';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Required for web OAuth completion
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '';

// Get the appropriate client ID for the current platform
function getClientId(): string {
  if (Platform.OS === 'ios' && GOOGLE_CLIENT_ID_IOS) {
    return GOOGLE_CLIENT_ID_IOS;
  }
  if (Platform.OS === 'android' && GOOGLE_CLIENT_ID_ANDROID) {
    return GOOGLE_CLIENT_ID_ANDROID;
  }
  return GOOGLE_CLIENT_ID;
}

// Google OAuth discovery document
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// OAuth scopes for Google services
const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
];

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: string;
  }>;
  created: string;
  updated: string;
  status: string;
  htmlLink: string;
}

export interface GoogleState {
  // Auth status
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;

  // Calendar events
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;

  // Actions
  checkAuthStatus: () => Promise<boolean>;
  promptGoogleAuth: () => Promise<boolean>;
  handleOAuthCallback: (code: string) => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  listEvents: (params: {
    leadId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }) => Promise<GoogleEvent[]>;
  createEvent: (params: {
    leadId: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    attendees?: Array<{
      email: string;
      name?: string;
    }>;
    sendNotifications?: boolean;
  }) => Promise<GoogleEvent>;
  sendEmail: (params: {
    leadId: string;
    to: Array<{
      email: string;
      name?: string;
    }>;
    subject: string;
    body: string;
    isHtml?: boolean;
  }) => Promise<{ id: string; threadId: string }>;
  clearError: () => void;
}

export const useGoogleStore = create<GoogleState>((set, get) => ({
  // State
  isAuthorized: false,
  isLoading: false,
  error: null,
  events: [],
  eventsLoading: false,
  eventsError: null,

  // Check if the user has a valid Google token
  checkAuthStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      // Get most recent token
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .select('access_token, expiry_date')
        .eq('user_id', user.user.id)
        .eq('provider', 'google')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(`Error fetching token: ${error.message}`);
      }

      const isAuthorized = !!(token && token.access_token);
      set({ isAuthorized, isLoading: false });
      return isAuthorized;
    } catch (error: any) {
      console.error('Auth check error:', error);
      set({ error: error.message, isLoading: false, isAuthorized: false });
      return false;
    }
  },

  // Prompt the user for Google authorization using expo-auth-session
  promptGoogleAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      const clientId = getClientId();
      if (!clientId) {
        throw new Error('Google OAuth not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your environment.');
      }

      // Create redirect URI based on platform
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'doughy',
        path: 'oauth/google',
      });

      // Create the auth request
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: SCOPES,
        redirectUri,
        usePKCE: true,
      });

      // Prompt the user for authorization
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange the authorization code for tokens
        const success = await get().handleOAuthCallback(result.params.code);
        set({ isLoading: false });
        return success;
      } else if (result.type === 'cancel') {
        set({ isLoading: false, error: 'Authorization was cancelled' });
        return false;
      } else if (result.type === 'error') {
        throw new Error(result.params?.error_description || 'Authorization failed');
      }

      set({ isLoading: false });
      return false;
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Handle the OAuth callback by exchanging the code for tokens
  handleOAuthCallback: async (code: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      const clientId = getClientId();
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'doughy',
        path: 'oauth/google',
      });

      // Exchange authorization code for tokens via Supabase Edge Function
      // This keeps the client secret secure on the server
      const { data, error } = await supabase.functions.invoke('google_oauth_exchange', {
        body: {
          code,
          redirectUri,
          clientId,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Store the tokens in the oauth_tokens table
      const { error: tokenError } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.user.id,
          provider: 'google',
          access_token: data.access_token,
          refresh_token: data.refresh_token || null,
          expiry_date: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider',
        });

      if (tokenError) {
        throw tokenError;
      }

      set({ isAuthorized: true });
      return true;
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Disconnect Google account by removing stored tokens
  disconnectGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      // Get the access token to revoke it
      const { data: token } = await supabase
        .from('oauth_tokens')
        .select('access_token')
        .eq('user_id', user.user.id)
        .eq('provider', 'google')
        .maybeSingle();

      // Revoke the token if it exists
      if (token?.access_token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${token.access_token}`, {
            method: 'POST',
          });
        } catch {
          // Ignore revocation errors - token may already be invalid
        }
      }

      // Delete the token from the database
      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.user.id)
        .eq('provider', 'google');

      if (error) {
        throw error;
      }

      set({ isAuthorized: false, events: [], isLoading: false });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // List Google Calendar events
  listEvents: async ({ leadId, timeMin, timeMax, maxResults }) => {
    set({ eventsLoading: true, eventsError: null });

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google_calendar', {
        method: 'GET',
        body: {
          userId: user.user.id,
          leadId,
          timeMin,
          timeMax,
          maxResults,
        },
      });

      if (error) throw error;

      const events = data.items || [];
      set({ events, eventsLoading: false });
      return events;
    } catch (error: any) {
      set({ eventsError: error.message, eventsLoading: false });
      throw error;
    }
  },

  // Create a Google Calendar event
  createEvent: async (params) => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google_calendar', {
        method: 'POST',
        body: {
          userId: user.user.id,
          ...params,
        },
      });

      if (error) throw error;

      // Update local events cache
      const currentEvents = [...get().events];
      currentEvents.push(data);
      set({ events: currentEvents });

      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Send an email via Gmail
  sendEmail: async (params) => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('gmail/send', {
        body: {
          userId: user.user.id,
          ...params,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
