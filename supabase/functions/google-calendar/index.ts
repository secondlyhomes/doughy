/**
 * Google Calendar Edge Function
 *
 * Provides calendar operations using shared OAuth credentials from
 * rental_email_connections table. Supports:
 * - Listing calendar events
 * - Creating events
 * - Updating events
 * - Deleting events
 *
 * Uses the same token refresh pattern as gmail-sync for consistency.
 *
 * Setup Required:
 * - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase secrets
 * - rental_email_connections with google_services including 'calendar'
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleCors, addCorsHeaders } from "../_shared/cors.ts";
import { decryptServer, encryptServer } from "../_shared/crypto-server.ts";

// =============================================================================
// Constants
// =============================================================================

const LOG_PREFIX = '[GoogleCalendar]';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// =============================================================================
// Types
// =============================================================================

type CalendarAction = 'list' | 'get' | 'create' | 'update' | 'delete' | 'sync';

interface CalendarRequest {
  action: CalendarAction;
  connectionId?: string;
  calendarId?: string;
  eventId?: string;
  event?: CalendarEventInput;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  syncToken?: string;
}

interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface CalendarEvent {
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

interface EmailConnection {
  id: string;
  workspace_id: string;
  user_id: string;
  provider: string;
  email_address: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string | null;
  is_active: boolean;
  google_services: string[];
  google_calendar_id: string | null;
  calendar_sync_token: string | null;
  last_calendar_sync_at: string | null;
}

// =============================================================================
// Token Management (reused from gmail-sync pattern)
// =============================================================================

/**
 * Refresh the access token if expired
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error(`${LOG_PREFIX} Missing Google OAuth credentials`);
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${LOG_PREFIX} Token refresh failed:`, errorText);
      return null;
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Token refresh error:`, error);
    return null;
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(
  connection: EmailConnection,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  let accessToken: string;
  let refreshToken: string;

  try {
    accessToken = await decryptServer(connection.access_token_encrypted);
    refreshToken = await decryptServer(connection.refresh_token_encrypted);
  } catch (error) {
    console.error(`${LOG_PREFIX} Token decryption failed:`, error);
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at)
    : new Date(0);
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs > Date.now()) {
    return accessToken;
  }

  // Refresh the token
  console.log(`${LOG_PREFIX} Refreshing expired token for ${connection.email_address}`);
  const refreshResult = await refreshAccessToken(refreshToken);

  if (!refreshResult) {
    await supabase
      .schema('integrations').from('email_connections')
      .update({
        sync_error: 'Failed to refresh access token. Please reconnect Google.',
        is_active: false,
      })
      .eq('id', connection.id);

    return null;
  }

  // Store new encrypted access token
  const newAccessTokenEncrypted = await encryptServer(refreshResult.accessToken);

  await supabase
    .schema('integrations').from('email_connections')
    .update({
      access_token_encrypted: newAccessTokenEncrypted,
      token_expires_at: refreshResult.expiresAt.toISOString(),
      sync_error: null,
    })
    .eq('id', connection.id);

  return refreshResult.accessToken;
}

// =============================================================================
// Calendar API Operations
// =============================================================================

/**
 * List calendar events
 */
async function listEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    syncToken?: string;
  }
): Promise<{
  events: CalendarEvent[];
  nextSyncToken?: string;
  error?: string;
}> {
  try {
    const url = new URL(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);

    if (options.syncToken) {
      url.searchParams.set('syncToken', options.syncToken);
    } else {
      if (options.timeMin) url.searchParams.set('timeMin', options.timeMin);
      if (options.timeMax) url.searchParams.set('timeMax', options.timeMax);
      url.searchParams.set('maxResults', String(options.maxResults || 100));
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
    }

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      // Handle sync token expiration
      if (response.status === 410) {
        return {
          events: [],
          error: 'SYNC_TOKEN_EXPIRED',
        };
      }
      const errorText = await response.text();
      return { events: [], error: `Calendar API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return {
      events: data.items || [],
      nextSyncToken: data.nextSyncToken,
    };
  } catch (error) {
    return {
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a single calendar event
 */
async function getEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<{ event?: CalendarEvent; error?: string }> {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Calendar API error: ${response.status} - ${errorText}` };
    }

    const event = await response.json();
    return { event };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a calendar event
 */
async function createEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEventInput
): Promise<{ event?: CalendarEvent; error?: string }> {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Calendar API error: ${response.status} - ${errorText}` };
    }

    const createdEvent = await response.json();
    return { event: createdEvent };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update a calendar event
 */
async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEventInput>
): Promise<{ event?: CalendarEvent; error?: string }> {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Calendar API error: ${response.status} - ${errorText}` };
    }

    const updatedEvent = await response.json();
    return { event: updatedEvent };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a calendar event
 */
async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      return { success: false, error: `Calendar API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Parse request body
    const body: CalendarRequest = await req.json();
    const {
      action,
      connectionId,
      calendarId: requestCalendarId,
      eventId,
      event,
      timeMin,
      timeMax,
      maxResults,
      syncToken,
    } = body;

    if (!action) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing action parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    console.log(`${LOG_PREFIX} Action: ${action}`);

    // Get the Google connection
    let query = supabase
      .schema('integrations').from('email_connections')
      .select('*')
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .contains('google_services', ['calendar']);

    if (connectionId) {
      query = query.eq('id', connectionId);
    }

    const { data: connections, error: connError } = await query.limit(1).single();

    if (connError || !connections) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'No active Google Calendar connection found. Please connect Google Calendar in settings.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const connection = connections as EmailConnection;
    const calendarId = requestCalendarId || connection.google_calendar_id || 'primary';

    // Get valid access token
    const accessToken = await getValidAccessToken(connection, supabase);
    if (!accessToken) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to get valid access token. Please reconnect Google.',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Execute the requested action
    let result: Record<string, unknown>;

    switch (action) {
      case 'list': {
        const listResult = await listEvents(accessToken, calendarId, {
          timeMin,
          timeMax,
          maxResults,
        });
        result = {
          success: !listResult.error,
          events: listResult.events,
          error: listResult.error,
        };
        break;
      }

      case 'sync': {
        const useSyncToken = syncToken || connection.calendar_sync_token;
        const syncResult = await listEvents(accessToken, calendarId, {
          timeMin: useSyncToken ? undefined : timeMin,
          timeMax: useSyncToken ? undefined : timeMax,
          maxResults,
          syncToken: useSyncToken || undefined,
        });

        // Handle expired sync token
        if (syncResult.error === 'SYNC_TOKEN_EXPIRED') {
          // Clear sync token and retry without it
          await supabase
            .schema('integrations').from('email_connections')
            .update({ calendar_sync_token: null })
            .eq('id', connection.id);

          const retryResult = await listEvents(accessToken, calendarId, {
            timeMin,
            timeMax,
            maxResults,
          });

          if (retryResult.nextSyncToken) {
            await supabase
              .schema('integrations').from('email_connections')
              .update({
                calendar_sync_token: retryResult.nextSyncToken,
                last_calendar_sync_at: new Date().toISOString(),
              })
              .eq('id', connection.id);
          }

          result = {
            success: !retryResult.error,
            events: retryResult.events,
            nextSyncToken: retryResult.nextSyncToken,
            fullSync: true,
            error: retryResult.error,
          };
        } else {
          // Save new sync token
          if (syncResult.nextSyncToken) {
            await supabase
              .schema('integrations').from('email_connections')
              .update({
                calendar_sync_token: syncResult.nextSyncToken,
                last_calendar_sync_at: new Date().toISOString(),
              })
              .eq('id', connection.id);
          }

          result = {
            success: !syncResult.error,
            events: syncResult.events,
            nextSyncToken: syncResult.nextSyncToken,
            error: syncResult.error,
          };
        }
        break;
      }

      case 'get': {
        if (!eventId) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: 'Missing eventId parameter' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        const getResult = await getEvent(accessToken, calendarId, eventId);
        result = {
          success: !getResult.error,
          event: getResult.event,
          error: getResult.error,
        };
        break;
      }

      case 'create': {
        if (!event) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: 'Missing event parameter' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        const createResult = await createEvent(accessToken, calendarId, event);
        result = {
          success: !createResult.error,
          event: createResult.event,
          error: createResult.error,
        };
        break;
      }

      case 'update': {
        if (!eventId || !event) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: 'Missing eventId or event parameter' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        const updateResult = await updateEvent(accessToken, calendarId, eventId, event);
        result = {
          success: !updateResult.error,
          event: updateResult.event,
          error: updateResult.error,
        };
        break;
      }

      case 'delete': {
        if (!eventId) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: 'Missing eventId parameter' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        const deleteResult = await deleteEvent(accessToken, calendarId, eventId);
        result = {
          success: deleteResult.success,
          error: deleteResult.error,
        };
        break;
      }

      default:
        return addCorsHeaders(
          new Response(
            JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
    }

    console.log(`${LOG_PREFIX} ${action} completed successfully`);

    return addCorsHeaders(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      req
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${LOG_PREFIX} Error:`, error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
