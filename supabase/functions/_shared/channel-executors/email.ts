/**
 * Email Channel Executor
 *
 * Sends emails via Resend for drip campaigns.
 *
 * @module _shared/channel-executors/email
 */

import type { SupabaseClient, ChannelResult } from "./types.ts";

/**
 * Send Email via Resend
 *
 * @param supabase - Supabase client
 * @param userId - User ID for profile lookup
 * @param to - Recipient email
 * @param subject - Email subject
 * @param body - Email body (plain text)
 * @returns Channel result with success/error
 */
export async function sendEmail(
  supabase: SupabaseClient,
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<ChannelResult> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  // Get user's from email
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('email, full_name, business_name')
    .eq('user_id', userId)
    .single();

  // Log if profile fetch failed (not just "not found")
  if (profileError && profileError.code !== 'PGRST116') {
    console.warn('[ChannelExecutor] Error fetching user profile, using defaults:', profileError);
  }

  const fromName = (profile?.business_name || profile?.full_name || 'Doughy') as string;
  const fromEmail = (profile?.email || 'noreply@doughy.app') as string;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Resend error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
