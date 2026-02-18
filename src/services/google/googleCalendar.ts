/**
 * Google Calendar Service
 *
 * Frontend service for interacting with the Google Calendar edge function.
 * Uses shared OAuth credentials from the unified Google authentication system.
 *
 * @see supabase/functions/google-calendar/index.ts
 */

import { supabase } from '@/lib/supabase';
import { isServiceEnabled } from './googleAuth';

// =============================================================================
// Types
// =============================================================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  created: string;
  updated: string;
  status: string;
  htmlLink: string;
}

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface CalendarListOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  [key: string]: string | number | undefined;
}

export interface CalendarSyncResult {
  events: CalendarEvent[];
  nextSyncToken?: string;
  fullSync?: boolean;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Check if Google Calendar is connected and enabled
 */
export async function isCalendarConnected(): Promise<boolean> {
  return isServiceEnabled('calendar');
}

/**
 * Call the Google Calendar edge function
 */
async function callCalendarApi<T>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...params }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Calendar operation failed' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('[GoogleCalendar] API call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List calendar events
 *
 * @param options - Filter options for the event list
 * @returns List of calendar events
 */
export async function listCalendarEvents(
  options: CalendarListOptions = {}
): Promise<{ success: boolean; events?: CalendarEvent[]; error?: string }> {
  const result = await callCalendarApi<{ events: CalendarEvent[] }>('list', options);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    events: result.data?.events || [],
  };
}

/**
 * List upcoming calendar events (next 7 days)
 */
export async function listUpcomingEvents(
  maxResults = 10
): Promise<{ success: boolean; events?: CalendarEvent[]; error?: string }> {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return listCalendarEvents({
    timeMin: now.toISOString(),
    timeMax: nextWeek.toISOString(),
    maxResults,
  });
}

/**
 * Sync calendar events using incremental sync
 * This is more efficient for getting updates after initial fetch
 *
 * @param syncToken - Optional sync token from previous sync
 * @returns Synced events and new sync token
 */
export async function syncCalendarEvents(
  syncToken?: string
): Promise<{ success: boolean; data?: CalendarSyncResult; error?: string }> {
  const result = await callCalendarApi<CalendarSyncResult>('sync', {
    syncToken,
    // For initial sync without token, get last 30 days
    timeMin: syncToken ? undefined : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Get a single calendar event by ID
 *
 * @param eventId - The event ID
 * @returns The calendar event
 */
export async function getCalendarEvent(
  eventId: string
): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
  const result = await callCalendarApi<{ event: CalendarEvent }>('get', { eventId });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    event: result.data?.event,
  };
}

/**
 * Create a new calendar event
 *
 * @param event - The event data
 * @returns The created event
 */
export async function createCalendarEvent(
  event: CreateEventInput
): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
  const result = await callCalendarApi<{ event: CalendarEvent }>('create', { event });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    event: result.data?.event,
  };
}

/**
 * Update an existing calendar event
 *
 * @param eventId - The event ID to update
 * @param event - The updated event data
 * @returns The updated event
 */
export async function updateCalendarEvent(
  eventId: string,
  event: UpdateEventInput
): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
  const result = await callCalendarApi<{ event: CalendarEvent }>('update', {
    eventId,
    event,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    event: result.data?.event,
  };
}

/**
 * Delete a calendar event
 *
 * @param eventId - The event ID to delete
 * @returns Success status
 */
export async function deleteCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await callCalendarApi('delete', { eventId });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create an all-day event input
 */
export function createAllDayEvent(
  summary: string,
  date: Date,
  options: Omit<CreateEventInput, 'summary' | 'start' | 'end'> = {}
): CreateEventInput {
  const dateStr = date.toISOString().split('T')[0];

  return {
    summary,
    start: { date: dateStr },
    end: { date: dateStr },
    ...options,
  };
}

/**
 * Create a timed event input
 */
export function createTimedEvent(
  summary: string,
  startTime: Date,
  endTime: Date,
  options: Omit<CreateEventInput, 'summary' | 'start' | 'end'> = {}
): CreateEventInput {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    summary,
    start: { dateTime: startTime.toISOString(), timeZone },
    end: { dateTime: endTime.toISOString(), timeZone },
    ...options,
  };
}

/**
 * Format event time for display
 */
export function formatEventTime(event: CalendarEvent): string {
  if (event.start.date) {
    // All-day event
    return new Date(event.start.date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (event.start.dateTime) {
    const startDate = new Date(event.start.dateTime);
    const endDate = event.end.dateTime ? new Date(event.end.dateTime) : null;

    const dateStr = startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const startTimeStr = startDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
    }

    return `${dateStr}, ${startTimeStr}`;
  }

  return 'Unknown time';
}
