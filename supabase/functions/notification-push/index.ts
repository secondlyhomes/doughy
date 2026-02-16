/**
 * Notification Push Edge Function
 *
 * Sends push notifications via Expo Push API.
 * Reads tokens from claw.push_tokens, checks preferences from claw.notification_preferences,
 * logs to claw.notification_log.
 *
 * Supports both Doughy notification types (booking, lead, etc.)
 * and Claw notification types (approval_needed, task_completed, etc.).
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

type NotificationType =
  // Doughy types
  | 'new_message'
  | 'ai_response_pending'
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'lead_qualified'
  | 'system_alert'
  // Claw types
  | 'approval_needed'
  | 'agent_error'
  | 'daily_summary'
  | 'budget_alert'
  | 'kill_switch_activated'
  | 'task_completed';

interface NotificationRequest {
  user_id: string;
  type: NotificationType;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'default' | 'high';
}

interface NotificationResponse {
  success: boolean;
  tickets_sent?: number;
  errors?: string[];
}

interface ExpoPushTicket {
  id: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

// =============================================================================
// Expo Push
// =============================================================================

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(
  pushToken: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
    priority?: 'default' | 'high';
  }
): Promise<ExpoPushTicket | null> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        sound: notification.sound || 'default',
        priority: notification.priority || 'high',
        channelId: 'default',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo push error:', errorText);
      return null;
    }

    const result = await response.json();
    return result.data?.[0] || null;
  } catch (error) {
    console.error('Error sending Expo push:', error);
    return null;
  }
}

// =============================================================================
// Notification Content Templates
// =============================================================================

function getNotificationContent(
  type: NotificationType,
  data: Record<string, any>
): { title: string; body: string } {
  switch (type) {
    // Claw types
    case 'approval_needed':
      return {
        title: 'Approvals Waiting',
        body: data.count
          ? `${data.count} draft${data.count > 1 ? 's' : ''} ready for your review`
          : 'New drafts are ready for your review',
      };
    case 'task_completed':
      return {
        title: 'Task Complete',
        body: data.summary || 'A task has finished running',
      };
    case 'agent_error':
      return {
        title: 'Agent Error',
        body: data.error || 'An agent encountered an error',
      };
    case 'daily_summary':
      return {
        title: 'Daily Summary',
        body: data.summary || 'Your daily briefing is ready',
      };
    case 'budget_alert':
      return {
        title: 'Budget Alert',
        body: data.message || 'AI spending is approaching your limit',
      };
    case 'kill_switch_activated':
      return {
        title: 'Kill Switch Activated',
        body: 'All AI agents have been stopped',
      };

    // Doughy types
    case 'new_message':
      return {
        title: `New message from ${data.contact_name || 'Guest'}`,
        body: data.preview || 'You have a new message',
      };
    case 'ai_response_pending':
      return {
        title: 'AI Response Ready for Review',
        body: `${data.contact_name || 'A guest'} is waiting. Tap to review the suggested response.`,
      };
    case 'booking_request':
      return {
        title: 'New Booking Request',
        body: `${data.contact_name || 'Someone'} wants to book ${data.property_name || 'your property'}`,
      };
    case 'booking_confirmed':
      return {
        title: 'Booking Confirmed',
        body: `${data.contact_name || 'Guest'} is confirmed for ${data.dates || 'upcoming dates'}`,
      };
    case 'booking_cancelled':
      return {
        title: 'Booking Cancelled',
        body: `${data.contact_name || 'Guest'} cancelled their booking for ${data.property_name || 'your property'}`,
      };
    case 'lead_qualified':
      return {
        title: 'New Qualified Lead!',
        body: `${data.contact_name || 'A lead'} scored ${data.score || 'high'}. Tap to view.`,
      };
    case 'system_alert':
      return {
        title: data.alert_title || 'System Alert',
        body: data.alert_message || 'Check your app for details',
      };
    default:
      return {
        title: 'Notification',
        body: 'You have a new notification',
      };
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body: NotificationRequest = await req.json();
    const { user_id, type, title, body: notifBody, data, badge, sound, priority } = body;

    if (!user_id || !type) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing user_id or type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check notification preferences from claw.notification_preferences
    const { data: prefs } = await supabase
      .schema('claw')
      .from('notification_preferences')
      .select('is_enabled')
      .eq('user_id', user_id)
      .eq('event_type', type)
      .eq('channel', 'push')
      .maybeSingle();

    // If preference exists and is disabled, skip
    if (prefs && prefs.is_enabled === false) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: `Notifications disabled for type: ${type}` }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check quiet hours from claw.notification_settings
    const { data: settings } = await supabase
      .schema('claw')
      .from('notification_settings')
      .select('quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, quiet_hours_allow_approvals')
      .eq('user_id', user_id)
      .maybeSingle();

    if (settings?.quiet_hours_enabled) {
      const tz = settings.quiet_hours_timezone || 'America/New_York';
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
      const currentTime = formatter.format(now);

      const start = settings.quiet_hours_start; // e.g. "22:00:00"
      const end = settings.quiet_hours_end; // e.g. "07:00:00"

      if (start && end) {
        const inQuietHours = start > end
          ? currentTime >= start || currentTime < end // overnight (22:00 - 07:00)
          : currentTime >= start && currentTime < end;

        if (inQuietHours) {
          // Allow approvals through quiet hours if configured
          if (!(type === 'approval_needed' && settings.quiet_hours_allow_approvals)) {
            return addCorsHeaders(
              new Response(
                JSON.stringify({ success: false, error: 'Quiet hours active' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              ),
              req
            );
          }
        }
      }
    }

    // Get active push tokens from claw.push_tokens
    const { data: tokens, error: tokenError } = await supabase
      .schema('claw')
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (tokenError || !tokens || tokens.length === 0) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'User has no push tokens registered' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Build notification content
    const content = title && notifBody
      ? { title, body: notifBody }
      : getNotificationContent(type, data || {});

    // Send to all active tokens
    const errors: string[] = [];
    let ticketsSent = 0;

    for (const { token } of tokens) {
      const ticket = await sendExpoPush(token, {
        title: content.title,
        body: content.body,
        data: { type, ...data },
        badge,
        sound,
        priority,
      });

      if (ticket?.status === 'ok') {
        ticketsSent++;
      } else if (ticket?.status === 'error') {
        errors.push(ticket.message || 'Unknown push error');
        // Deactivate invalid tokens
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await supabase
            .schema('claw')
            .from('push_tokens')
            .update({ is_active: false })
            .eq('user_id', user_id)
            .eq('token', token);
        }
      }
    }

    // Log to claw.notification_log
    try {
      await supabase
        .schema('claw')
        .from('notification_log')
        .insert({
          user_id,
          event_type: type,
          channel: 'push',
          subject: content.title,
          body: content.body,
          related_task_id: data?.task_id || null,
          related_approval_id: data?.approval_id || null,
          delivered: ticketsSent > 0,
          delivery_error: errors.length > 0 ? errors.join('; ') : null,
          metadata: { tokens_attempted: tokens.length, tickets_sent: ticketsSent },
        });
    } catch (logError) {
      console.warn('Could not log notification:', logError);
    }

    const result: NotificationResponse = {
      success: ticketsSent > 0,
      tickets_sent: ticketsSent,
      errors: errors.length > 0 ? errors : undefined,
    };

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  } catch (error) {
    console.error('Notification push error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
