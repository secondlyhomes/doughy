/**
 * SMS Channel Executor
 *
 * Sends SMS messages via Twilio.
 *
 * @module _shared/channel-executors/sms
 */

import type { SupabaseClient, ChannelResult } from "./types.ts";

/**
 * Send SMS via Twilio
 *
 * @param supabase - Supabase client
 * @param userId - User ID for credentials lookup
 * @param to - Recipient phone number
 * @param body - Message body
 * @returns Channel result with success/error
 */
export async function sendSMS(
  supabase: SupabaseClient,
  userId: string,
  to: string,
  body: string
): Promise<ChannelResult> {
  // Get user's Twilio credentials
  const { data: credentials, error: credError } = await supabase
    .from('moltbot_channel_credentials')
    .select('account_sid, auth_token, phone_number')
    .eq('user_id', userId)
    .eq('channel', 'sms')
    .single();

  if (credError || !credentials) {
    return { success: false, error: 'SMS credentials not configured' };
  }

  try {
    const accountSid = credentials.account_sid as string;
    const authToken = credentials.auth_token as string;
    const fromNumber = credentials.phone_number as string;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: to,
        Body: body,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Twilio error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.sid };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
