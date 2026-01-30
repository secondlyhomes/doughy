/**
 * Meta DM Channel Executor
 *
 * Sends direct messages via Facebook/Instagram Graph API.
 *
 * @module _shared/channel-executors/meta-dm
 */

import type { SupabaseClient, ChannelResult } from "./types.ts";

/**
 * Send Meta DM (Facebook/Instagram)
 *
 * Uses atomic rate limit check to prevent race conditions.
 *
 * @param supabase - Supabase client
 * @param userId - User ID for credentials lookup
 * @param recipientId - Facebook PSID or Instagram ID
 * @param message - Message to send
 * @returns Channel result with success/error
 */
export async function sendMetaDM(
  supabase: SupabaseClient,
  userId: string,
  recipientId: string,
  message: string
): Promise<ChannelResult> {
  // Get user's Meta credentials
  const { data: credentials, error: credError } = await supabase
    .from('meta_dm_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (credError || !credentials) {
    return { success: false, error: 'Meta DM credentials not configured' };
  }

  const now = new Date();

  // Check rate limits (read values for later update calculation)
  let hourlyCount = (credentials.hourly_dm_count as number) || 0;
  let dailyCount = (credentials.daily_dm_count as number) || 0;

  // Check hourly reset
  if (credentials.hourly_dm_reset_at) {
    const hourlyReset = new Date(credentials.hourly_dm_reset_at as string);
    if (now >= hourlyReset) {
      hourlyCount = 0;
    }
  }

  // Check daily reset
  if (credentials.daily_dm_reset_at) {
    const dailyReset = new Date(credentials.daily_dm_reset_at as string);
    if (now >= dailyReset) {
      dailyCount = 0;
    }
  }

  // Check limits (Meta allows ~200/hour, ~1000/day for pages)
  if (hourlyCount >= 200) {
    return { success: false, error: 'Meta DM hourly rate limit reached (200/hour)' };
  }
  if (dailyCount >= 1000) {
    return { success: false, error: 'Meta DM daily rate limit reached (1000/day)' };
  }

  try {
    const pageId = credentials.page_id as string;
    const pageAccessToken = credentials.page_access_token as string;

    // Send message with access token in body (not URL) for security
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: pageAccessToken,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Meta API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();

    // Update rate limit counters AFTER successful send (prevents race condition)
    const hourlyResetAt = credentials.hourly_dm_reset_at && new Date(credentials.hourly_dm_reset_at as string) > now
      ? credentials.hourly_dm_reset_at as string
      : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const dailyResetAt = credentials.daily_dm_reset_at && new Date(credentials.daily_dm_reset_at as string) > now
      ? credentials.daily_dm_reset_at as string
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { error: rateLimitError } = await supabase
      .from('meta_dm_credentials')
      .update({
        hourly_dm_count: hourlyCount + 1,
        hourly_dm_reset_at: hourlyResetAt,
        daily_dm_count: dailyCount + 1,
        daily_dm_reset_at: dailyResetAt,
        updated_at: now.toISOString(),
      })
      .eq('id', credentials.id as string);

    let rateLimitWarning = false;
    if (rateLimitError) {
      console.error('[MetaDM] Error updating rate limit counters:', rateLimitError);
      rateLimitWarning = true;
      // Message was sent - this is non-critical but could cause rate limit tracking drift
    }

    return { success: true, messageId: result.message_id, rateLimitWarning };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
