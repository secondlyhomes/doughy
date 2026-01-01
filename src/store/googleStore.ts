// src/store/googleStore.ts
// Google integration store for React Native
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

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
  getAuthUrl: () => Promise<string>;
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

  // Get the Google OAuth URL
  // TODO: Implement deep linking for mobile OAuth flow
  getAuthUrl: async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      // For React Native, we need to use deep linking
      // This would need to be configured with your OAuth provider
      // For now, throw an error indicating this needs to be implemented
      throw new Error('Google OAuth not yet configured for mobile. Please set up deep linking.');

    } catch (error: any) {
      set({ error: error.message });
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
