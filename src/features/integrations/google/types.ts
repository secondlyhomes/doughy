// src/features/integrations/google/types.ts
// Google integration types

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

export interface CreateEventParams {
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
}

export interface ListEventsParams {
  leadId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export interface SendEmailParams {
  leadId: string;
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface GoogleState {
  // Auth status
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  isActionInProgress: boolean;

  // Calendar events
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;

  // Actions
  checkAuthStatus: () => Promise<boolean>;
  promptGoogleAuth: () => Promise<boolean>;
  handleOAuthCallback: (code: string) => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  listEvents: (params: ListEventsParams) => Promise<GoogleEvent[]>;
  createEvent: (params: CreateEventParams) => Promise<GoogleEvent>;
  sendEmail: (params: SendEmailParams) => Promise<{ id: string; threadId: string }>;
  clearError: () => void;
}
