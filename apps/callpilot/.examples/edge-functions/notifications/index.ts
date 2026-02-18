/**
 * Push Notifications Edge Function
 *
 * Send push notifications via Expo Push Service with:
 * - Single and batch sending
 * - Scheduled notifications
 * - Receipt tracking
 * - Platform-specific handling (iOS/Android)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types
interface PushToken {
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
}

interface NotificationRequest {
  userId?: string; // Single user
  userIds?: string[]; // Multiple users
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string | 'default';
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string; // Android only
  categoryId?: string; // iOS only
  ttl?: number; // Time to live in seconds
  scheduledTime?: string; // ISO date string for scheduling
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string | 'default';
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  categoryId?: string;
  ttl?: number;
}

interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: any;
  }>;
}

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPT_URL = 'https://exp.host/--/api/v2/push/getReceipts';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Authenticate request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body = (await req.json()) as NotificationRequest;

    // Validate request
    if (!body.title || !body.body) {
      return jsonResponse({ error: 'Title and body are required' }, 400);
    }

    if (!body.userId && !body.userIds) {
      return jsonResponse({ error: 'userId or userIds required' }, 400);
    }

    // Handle scheduled notifications
    if (body.scheduledTime) {
      return await handleScheduledNotification(supabase, body);
    }

    // Get user IDs
    const userIds = body.userId ? [body.userId] : body.userIds!;

    // Fetch push tokens for users
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', userIds);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return jsonResponse({ error: 'Failed to fetch push tokens' }, 500);
    }

    if (!tokens || tokens.length === 0) {
      return jsonResponse(
        {
          error: 'No push tokens found',
          message: 'Users have not registered for push notifications',
        },
        404
      );
    }

    // Build Expo messages
    const messages: ExpoMessage[] = tokens.map((token) => ({
      to: token.token,
      title: body.title,
      body: body.body,
      data: body.data,
      sound: body.sound || 'default',
      badge: body.badge,
      priority: body.priority || 'high',
      channelId: token.platform === 'android' ? body.channelId : undefined,
      categoryId: token.platform === 'ios' ? body.categoryId : undefined,
      ttl: body.ttl,
    }));

    // Send notifications
    const results = await sendPushNotifications(messages);

    // Log notification records
    await logNotifications(supabase, userIds, body, results);

    return jsonResponse({
      success: true,
      sent: results.filter((r) => r.status === 'ok').length,
      failed: results.filter((r) => r.status === 'error').length,
      results,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});

// Helper: Send push notifications via Expo
async function sendPushNotifications(
  messages: ExpoMessage[]
): Promise<ExpoPushResponse['data']> {
  // Expo recommends batching in groups of 100
  const batches = chunk(messages, 100);
  const allResults: ExpoPushResponse['data'] = [];

  for (const batch of batches) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Expo Push API error:', error);
      throw new Error(`Expo Push API error: ${response.status}`);
    }

    const result = (await response.json()) as ExpoPushResponse;
    allResults.push(...result.data);
  }

  return allResults;
}

// Helper: Handle scheduled notifications
async function handleScheduledNotification(
  supabase: ReturnType<typeof createClient>,
  notification: NotificationRequest
): Promise<Response> {
  const scheduledTime = new Date(notification.scheduledTime!);
  const now = new Date();

  if (scheduledTime <= now) {
    return jsonResponse(
      { error: 'Scheduled time must be in the future' },
      400
    );
  }

  // Store notification for later processing
  const { error } = await supabase.from('scheduled_notifications').insert({
    user_id: notification.userId,
    user_ids: notification.userIds,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: notification.sound,
    badge: notification.badge,
    priority: notification.priority,
    scheduled_for: scheduledTime.toISOString(),
    status: 'pending',
  });

  if (error) {
    console.error('Error scheduling notification:', error);
    return jsonResponse({ error: 'Failed to schedule notification' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Notification scheduled',
    scheduledFor: scheduledTime.toISOString(),
  });
}

// Helper: Log notifications
async function logNotifications(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  notification: NotificationRequest,
  results: ExpoPushResponse['data']
) {
  const records = userIds.map((userId, index) => ({
    user_id: userId,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    status: results[index]?.status || 'unknown',
    push_ticket_id: results[index]?.id,
    error_message: results[index]?.message,
    sent_at: new Date().toISOString(),
  }));

  await supabase.from('notification_logs').insert(records);
}

// Helper: Chunk array
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper: JSON response
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
