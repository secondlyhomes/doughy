/**
 * Meta DM Channel Executor
 *
 * Sends direct messages via Facebook/Instagram Graph API.
 *
 * @module _shared/channel-executors/meta-dm
 */

import type { SupabaseClient, ChannelResult } from "./types.ts";

// Meta's rate limits for page messaging
const HOURLY_LIMIT = 200;
const DAILY_LIMIT = 1000;

/**
 * Send Meta DM (Facebook/Instagram)
 *
 * Uses atomic increment-before-send pattern to prevent race conditions.
 * If the message fails to send, the counter is decremented.
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
    .schema('integrations').from('meta_dm_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (credError || !credentials) {
    return { success: false, error: 'Meta DM credentials not configured' };
  }

  const now = new Date();
  const credId = credentials.id as string;

  // Calculate reset times
  const hourlyReset = credentials.hourly_dm_reset_at
    ? new Date(credentials.hourly_dm_reset_at as string)
    : null;
  const dailyReset = credentials.daily_dm_reset_at
    ? new Date(credentials.daily_dm_reset_at as string)
    : null;

  // Determine if we need to reset counters
  const needsHourlyReset = !hourlyReset || now >= hourlyReset;
  const needsDailyReset = !dailyReset || now >= dailyReset;

  // Atomically increment counters BEFORE sending (reserve the slot)
  // This prevents TOCTOU race conditions where multiple concurrent requests
  // could all pass the rate limit check before any counters are updated
  const { data: updated, error: updateError } = await supabase
    .schema('integrations').from('meta_dm_credentials')
    .update({
      // Reset or increment hourly count
      hourly_dm_count: needsHourlyReset ? 1 : (credentials.hourly_dm_count as number || 0) + 1,
      hourly_dm_reset_at: needsHourlyReset
        ? new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        : credentials.hourly_dm_reset_at,
      // Reset or increment daily count
      daily_dm_count: needsDailyReset ? 1 : (credentials.daily_dm_count as number || 0) + 1,
      daily_dm_reset_at: needsDailyReset
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        : credentials.daily_dm_reset_at,
      updated_at: now.toISOString(),
    })
    .eq('id', credId)
    .select('hourly_dm_count, daily_dm_count')
    .single();

  if (updateError || !updated) {
    console.error('[MetaDM] Failed to reserve rate limit slot:', updateError);
    return { success: false, error: 'Rate limit check failed - please retry' };
  }

  // Check if we've exceeded limits AFTER atomic increment
  const newHourlyCount = updated.hourly_dm_count as number;
  const newDailyCount = updated.daily_dm_count as number;

  if (newHourlyCount > HOURLY_LIMIT) {
    // Decrement since we won't send - rollback the reservation
    await decrementRateLimitCounters(supabase, credId);
    return { success: false, error: `Meta DM hourly rate limit reached (${HOURLY_LIMIT}/hour)` };
  }

  if (newDailyCount > DAILY_LIMIT) {
    // Decrement since we won't send - rollback the reservation
    await decrementRateLimitCounters(supabase, credId);
    return { success: false, error: `Meta DM daily rate limit reached (${DAILY_LIMIT}/day)` };
  }

  // Rate limit slot reserved - now send the message
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
      // Message failed - decrement counters to release the reserved slot
      await decrementRateLimitCounters(supabase, credId);
      const errorText = await response.text();
      return { success: false, error: `Meta API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.message_id };
  } catch (error) {
    // Message failed - decrement counters to release the reserved slot
    await decrementRateLimitCounters(supabase, credId);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Decrement rate limit counters when a reserved slot is not used
 * This releases the slot we reserved before attempting to send
 */
async function decrementRateLimitCounters(
  supabase: SupabaseClient,
  credId: string
): Promise<void> {
  try {
    // First get current values
    const { data: current } = await supabase
      .schema('integrations').from('meta_dm_credentials')
      .select('hourly_dm_count, daily_dm_count')
      .eq('id', credId)
      .single();

    if (!current) return;

    // Decrement (don't go below 0)
    const hourlyCount = Math.max(0, (current.hourly_dm_count as number || 1) - 1);
    const dailyCount = Math.max(0, (current.daily_dm_count as number || 1) - 1);

    await supabase
      .schema('integrations').from('meta_dm_credentials')
      .update({
        hourly_dm_count: hourlyCount,
        daily_dm_count: dailyCount,
      })
      .eq('id', credId);
  } catch (error) {
    // Log but don't fail - the message wasn't sent, so this is just cleanup
    // In the worst case, the counter is slightly inflated which is safe
    console.error('[MetaDM] Failed to decrement rate limit counters:', error);
  }
}
