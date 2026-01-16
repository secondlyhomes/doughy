/**
 * Scheduled Reminders Edge Function
 * Description: Runs daily to find deals with upcoming actions and send notifications
 * Phase: Sprint 3 - AI & Automation
 * Cron: 0 8 * * * (Daily at 8am)
 * Enhanced by Zone D: Added Expo push notifications and in-app notification creation
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-standardized.ts';

interface DealWithRelations {
  id: string;
  user_id: string;
  title: string;
  next_action: string;
  next_action_due: string;
  status: string;
  lead?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  property?: {
    id: string;
    address_line_1: string;
    city: string;
    state: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  expo_push_token?: string;
  notification_preferences?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}

/**
 * Send push notifications via Expo Push API
 */
async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  if (messages.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const result = { sent: 0, failed: 0, errors: [] as string[] };

  try {
    // Expo push API accepts batches of up to 100 messages
    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    for (const batch of batches) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Scheduled-Reminders] Expo push error:', errorText);
        result.failed += batch.length;
        result.errors.push(`Expo API error: ${response.status}`);
        continue;
      }

      const responseData = await response.json();

      // Check individual ticket statuses
      if (responseData.data) {
        for (const ticket of responseData.data) {
          if (ticket.status === 'ok') {
            result.sent++;
          } else {
            result.failed++;
            if (ticket.message) {
              result.errors.push(ticket.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Scheduled-Reminders] Error sending push notifications:', error);
    result.failed += messages.length;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Format due date for display
 */
function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `in ${diffHours} hours`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Calculate time window: next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log('Checking for deals with actions due between:', {
      start: now.toISOString(),
      end: tomorrow.toISOString(),
    });

    // Get deals with upcoming actions (next 24 hours)
    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        id,
        user_id,
        title,
        next_action,
        next_action_due,
        status,
        lead:leads(id, name, email, phone),
        property:re_properties(id, address_line_1, city, state)
      `)
      .gte('next_action_due', now.toISOString())
      .lte('next_action_due', tomorrow.toISOString())
      .eq('status', 'active')
      .order('next_action_due', { ascending: true });

    if (error) {
      console.error('Error querying deals:', error);
      throw error;
    }

    console.log(`Found ${deals?.length || 0} deals with upcoming actions`);

    if (!deals || deals.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          message: 'No upcoming actions found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Group deals by user for batch notifications
    const dealsByUser = new Map<string, DealWithRelations[]>();
    for (const deal of deals as DealWithRelations[]) {
      if (!dealsByUser.has(deal.user_id)) {
        dealsByUser.set(deal.user_id, []);
      }
      dealsByUser.get(deal.user_id)!.push(deal);
    }

    console.log(`Grouped into ${dealsByUser.size} users`);

    // Fetch user profiles with push tokens
    const userIds = Array.from(dealsByUser.keys());
    const { data: userProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, expo_push_token, notification_preferences')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
    }

    const profileMap = new Map<string, UserProfile>();
    for (const profile of (userProfiles || []) as UserProfile[]) {
      profileMap.set(profile.id, profile);
    }

    // Prepare notifications
    const pushMessages: ExpoPushMessage[] = [];
    const inAppNotifications: Array<{
      user_id: string;
      type: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
    }> = [];
    const notificationSummaries: Array<{
      user_id: string;
      deal_count: number;
      push_sent: boolean;
      notification_created: boolean;
      deals: Array<{ title: string; action: string; due: string }>;
    }> = [];

    for (const [userId, userDeals] of dealsByUser.entries()) {
      const profile = profileMap.get(userId);
      const prefs = profile?.notification_preferences || { push: true, email: true };

      // Build notification content
      const dealCount = userDeals.length;
      const title = dealCount === 1
        ? `Deal Reminder: ${userDeals[0].title}`
        : `${dealCount} Deals Need Attention`;

      const body = dealCount === 1
        ? `${userDeals[0].next_action || 'Action needed'} - due ${formatDueDate(userDeals[0].next_action_due)}`
        : userDeals
            .slice(0, 3)
            .map(d => `• ${d.title}: ${d.next_action || 'Action needed'}`)
            .join('\n') + (dealCount > 3 ? `\n...and ${dealCount - 3} more` : '');

      const notificationData = {
        type: 'deal_reminder',
        deal_ids: userDeals.map(d => d.id),
        deal_count: dealCount,
      };

      // Add push notification if user has token and wants push
      let pushQueued = false;
      if (profile?.expo_push_token && prefs.push !== false) {
        pushMessages.push({
          to: profile.expo_push_token,
          sound: 'default',
          title,
          body,
          data: notificationData,
          badge: dealCount,
        });
        pushQueued = true;
      }

      // Always create in-app notification
      inAppNotifications.push({
        user_id: userId,
        type: 'deal_reminder',
        title,
        body,
        data: notificationData,
      });

      notificationSummaries.push({
        user_id: userId,
        deal_count: dealCount,
        push_sent: pushQueued,
        notification_created: true,
        deals: userDeals.map(deal => ({
          title: deal.title,
          action: deal.next_action || 'No action specified',
          due: deal.next_action_due,
        })),
      });

      console.log('Notification prepared for user:', userId, {
        dealCount,
        hasPushToken: !!profile?.expo_push_token,
        pushQueued,
      });
    }

    // Send push notifications
    const pushResult = await sendExpoPushNotifications(pushMessages);
    console.log('Push notification results:', pushResult);

    // Create in-app notifications
    if (inAppNotifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(
          inAppNotifications.map(n => ({
            ...n,
            push_sent: pushMessages.some(p => p.data?.deal_ids?.includes?.(n.data.deal_ids?.[0])),
            push_sent_at: pushMessages.length > 0 ? new Date().toISOString() : null,
          }))
        );

      if (insertError) {
        console.error('Error creating in-app notifications:', insertError);
      } else {
        console.log(`Created ${inAppNotifications.length} in-app notifications`);
      }
    }

    // Log summary to system_logs
    await supabase
      .from('system_logs')
      .insert({
        level: 'info',
        source: 'scheduled-reminders',
        message: `Processed ${deals.length} upcoming actions for ${dealsByUser.size} users`,
        details: {
          total_deals: deals.length,
          total_users: dealsByUser.size,
          push_notifications: {
            sent: pushResult.sent,
            failed: pushResult.failed,
            errors: pushResult.errors.slice(0, 5), // Limit error log size
          },
          in_app_notifications: inAppNotifications.length,
          timestamp: now.toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        count: deals.length,
        users: dealsByUser.size,
        push: {
          sent: pushResult.sent,
          failed: pushResult.failed,
        },
        in_app: inAppNotifications.length,
        notifications: notificationSummaries,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scheduled-reminders:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
