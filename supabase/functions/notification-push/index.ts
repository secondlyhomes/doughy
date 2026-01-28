/**
 * Notification Push Edge Function
 *
 * Sends push notifications to property owners via Expo Push Notifications.
 * Handles various notification types: new messages, AI responses pending,
 * booking updates, and system alerts.
 *
 * @see /docs/doughy-architecture-refactor.md for notification types
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

type NotificationType =
  | 'new_message'
  | 'ai_response_pending'
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'lead_qualified'
  | 'system_alert';

interface NotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'default' | 'high';
}

interface NotificationResponse {
  success: boolean;
  ticket_id?: string;
  error?: string;
}

interface ExpoPushTicket {
  id: string;
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

// =============================================================================
// Expo Push Notification
// =============================================================================

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification via Expo
 */
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

/**
 * Get notification title and body templates
 */
function getNotificationContent(
  type: NotificationType,
  data: Record<string, any>
): { title: string; body: string } {
  switch (type) {
    case 'new_message':
      return {
        title: `New message from ${data.contact_name || 'Guest'}`,
        body: data.preview || 'You have a new message'
      };

    case 'ai_response_pending':
      return {
        title: 'AI Response Ready for Review',
        body: `${data.contact_name || 'A guest'} is waiting. Tap to review the suggested response.`
      };

    case 'booking_request':
      return {
        title: 'New Booking Request',
        body: `${data.contact_name || 'Someone'} wants to book ${data.property_name || 'your property'}`
      };

    case 'booking_confirmed':
      return {
        title: 'Booking Confirmed',
        body: `${data.contact_name || 'Guest'} is confirmed for ${data.dates || 'upcoming dates'}`
      };

    case 'booking_cancelled':
      return {
        title: 'Booking Cancelled',
        body: `${data.contact_name || 'Guest'} cancelled their booking for ${data.property_name || 'your property'}`
      };

    case 'lead_qualified':
      return {
        title: 'New Qualified Lead!',
        body: `${data.contact_name || 'A lead'} scored ${data.score || 'high'}. Tap to view.`
      };

    case 'system_alert':
      return {
        title: data.alert_title || 'System Alert',
        body: data.alert_message || 'Check your Doughy app for details'
      };

    default:
      return {
        title: 'Doughy Notification',
        body: 'You have a new notification'
      };
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: NotificationRequest = await req.json();
    const { user_id, type, title, body: notifBody, data, badge, sound, priority } = body;

    // Validate required fields
    if (!user_id || !type) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing user_id or type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get user's push token from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('push_token, notification_preferences')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check if user has push token
    if (!profile.push_token) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'User has no push token registered' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check notification preferences
    const prefs = profile.notification_preferences || {};
    if (prefs[type] === false) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: `Notifications disabled for type: ${type}` }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get content from template or use provided
    const content = title && notifBody
      ? { title, body: notifBody }
      : getNotificationContent(type, data || {});

    // Send push notification
    const ticket = await sendExpoPush(profile.push_token, {
      title: content.title,
      body: content.body,
      data: {
        type,
        ...data
      },
      badge,
      sound,
      priority
    });

    if (!ticket) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Failed to send push notification' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Log notification to user_notifications table if it exists
    try {
      await supabase
        .from('user_notifications')
        .insert({
          user_id,
          type,
          title: content.title,
          body: content.body,
          data,
          push_ticket_id: ticket.id,
          status: ticket.status,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Could not log notification:', logError);
    }

    const result: NotificationResponse = {
      success: ticket.status === 'ok',
      ticket_id: ticket.id,
      error: ticket.status === 'error' ? ticket.message : undefined
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
