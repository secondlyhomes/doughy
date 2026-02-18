// src/features/integrations/google/store.ts
// Google integration Zustand store

import { create } from 'zustand';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { GoogleState, GoogleEvent, CreateEventParams, ListEventsParams, SendEmailParams } from './types';
import {
  discovery,
  SCOPES,
  OAUTH_TIMEOUT_MS,
  getClientId,
  getRedirectUri,
  isTokenExpired,
  withTimeout,
} from './config';
import {
  getAuthenticatedUserId,
  getStoredToken,
  storeToken,
  updateToken,
  deleteToken,
  revokeToken,
} from './helpers';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleStore = create<GoogleState>((set, get) => ({
  isAuthorized: false,
  isLoading: false,
  error: null,
  isActionInProgress: false,
  events: [],
  eventsLoading: false,
  eventsError: null,

  checkAuthStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await getAuthenticatedUserId();
      const token = await getStoredToken(userId);

      if (token?.access_token) {
        if (isTokenExpired(token.expiry_date)) {
          if (token.refresh_token) {
            const refreshed = await get().refreshToken();
            set({ isLoading: false });
            return refreshed;
          }
          set({ isAuthorized: false, isLoading: false });
          return false;
        }
        set({ isAuthorized: true, isLoading: false, error: null });
        return true;
      }
      set({ isAuthorized: false, isLoading: false });
      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error checking auth status';
      set({ error: message, isLoading: false, isAuthorized: false });
      return false;
    }
  },

  promptGoogleAuth: async () => {
    if (get().isActionInProgress) return false;
    set({ isLoading: true, error: null, isActionInProgress: true });

    try {
      await getAuthenticatedUserId();
      const clientId = getClientId();
      if (!clientId) throw new Error('Google OAuth not configured');

      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: SCOPES,
        redirectUri: getRedirectUri(),
        usePKCE: true,
      });

      const result = await withTimeout(
        request.promptAsync(discovery),
        OAUTH_TIMEOUT_MS,
        'OAuth flow timed out'
      );

      if (result.type === 'success' && result.params.code) {
        const success = await get().handleOAuthCallback(result.params.code);
        set({ isLoading: false, isActionInProgress: false, error: success ? null : get().error });
        return success;
      } else if (result.type === 'cancel') {
        set({ isLoading: false, isActionInProgress: false, error: 'Authorization was cancelled' });
        return false;
      } else if (result.type === 'error') {
        throw new Error(result.params?.error_description || 'Authorization failed');
      }

      set({ isLoading: false, isActionInProgress: false });
      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown OAuth error';
      set({ error: message, isLoading: false, isActionInProgress: false });
      return false;
    }
  },

  handleOAuthCallback: async (code: string) => {
    try {
      const userId = await getAuthenticatedUserId();
      const { data, error } = await supabase.functions.invoke('google_oauth_exchange', {
        body: { code, redirectUri: getRedirectUri(), clientId: getClientId() },
      });

      if (error) throw new Error(`Token exchange failed: ${error.message || 'Unknown'}`);
      if (!data?.access_token) throw new Error('Failed to obtain access token');

      await storeToken(userId, data);
      set({ isAuthorized: true, error: null });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown OAuth callback error';
      set({ error: message });
      return false;
    }
  },

  refreshToken: async () => {
    try {
      const userId = await getAuthenticatedUserId();
      const token = await getStoredToken(userId);
      if (!token?.refresh_token) {
        set({ isAuthorized: false });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('google_oauth_refresh', {
        body: { refreshToken: token.refresh_token, clientId: getClientId() },
      });

      if (error || !data?.access_token) {
        set({ isAuthorized: false });
        return false;
      }

      await updateToken(userId, data);
      set({ isAuthorized: true, error: null });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown token refresh error';
      set({ error: message, isAuthorized: false });
      return false;
    }
  },

  disconnectGoogle: async () => {
    if (get().isActionInProgress) return;
    set({ isLoading: true, error: null, isActionInProgress: true });

    try {
      const userId = await getAuthenticatedUserId();
      const token = await getStoredToken(userId);
      if (token?.access_token) await revokeToken(token.access_token);
      await deleteToken(userId);
      set({ isAuthorized: false, events: [], isLoading: false, isActionInProgress: false, error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown disconnect error';
      set({ error: message, isLoading: false, isActionInProgress: false });
      throw error;
    }
  },

  listEvents: async (params: ListEventsParams) => {
    set({ eventsLoading: true, eventsError: null });
    try {
      const userId = await getAuthenticatedUserId();
      const { data, error } = await supabase.functions.invoke('google_calendar', {
        method: 'GET',
        body: { userId, ...params },
      });

      if (error) throw new Error(error.message || 'Failed to fetch events');
      const events = data?.items || [];
      set({ events, eventsLoading: false });
      return events;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching events';
      set({ eventsError: message, eventsLoading: false });
      throw error;
    }
  },

  createEvent: async (params: CreateEventParams) => {
    try {
      const userId = await getAuthenticatedUserId();
      const { data, error } = await supabase.functions.invoke('google_calendar', {
        method: 'POST',
        body: { userId, ...params },
      });

      if (error) throw new Error(error.message || 'Failed to create event');
      if (!data) throw new Error('No event data returned');

      set({ events: [...get().events, data], error: null });
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error creating event';
      set({ error: message });
      throw error;
    }
  },

  sendEmail: async (params: SendEmailParams) => {
    try {
      const userId = await getAuthenticatedUserId();
      const { data, error } = await supabase.functions.invoke('gmail/send', {
        body: { userId, ...params },
      });

      if (error) throw new Error(error.message || 'Failed to send email');
      if (!data) throw new Error('No response data from email send');
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error sending email';
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null, eventsError: null }),
}));
