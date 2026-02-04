/**
 * Phone Reminder Channel Executor
 *
 * Creates phone call reminders and sends push notifications.
 *
 * @module _shared/channel-executors/phone-reminder
 */

import type { SupabaseClient, ChannelResult } from "./types.ts";

interface PhoneReminderParams {
  userId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  talkingPoints?: string[];
  callScript?: string;
  enrollmentId: string;
}

/**
 * Create phone reminder notification
 *
 * Creates a follow-up record and sends a push notification.
 *
 * @param supabase - Supabase client
 * @param params - Phone reminder parameters
 * @returns Channel result with success/error
 */
export async function createPhoneReminder(
  supabase: SupabaseClient,
  params: PhoneReminderParams
): Promise<ChannelResult> {
  const {
    userId,
    contactId,
    contactName,
    contactPhone,
    talkingPoints,
    callScript,
    enrollmentId,
  } = params;

  try {
    // Create a follow-up record for the phone call
    const { data: followUp, error: followUpError } = await supabase
      .schema('investor')
      .from('follow_ups')
      .insert({
        user_id: userId,
        contact_id: contactId,
        follow_up_type: 'campaign_sequence',
        scheduled_at: new Date().toISOString(),
        channel: 'phone',
        message_template: callScript,
        ai_generated_message: talkingPoints?.join('\n'),
        status: 'scheduled',
        context: {
          source: 'drip_campaign',
          enrollment_id: enrollmentId,
          talking_points: talkingPoints,
        },
      })
      .select()
      .single();

    if (followUpError) {
      return { success: false, error: followUpError.message };
    }

    // Trigger push notification
    const pushUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notification-push`;
    try {
      const pushResponse = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SECRET_KEY')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          title: `Call Reminder: ${contactName}`,
          body: `Time to call ${contactName} at ${contactPhone}`,
          data: {
            type: 'phone_reminder',
            contact_id: contactId,
            follow_up_id: followUp?.id,
            phone: contactPhone,
          },
        }),
      });

      if (!pushResponse.ok) {
        console.error('[PhoneReminder] Push notification failed:', pushResponse.status, await pushResponse.text());
        // Follow-up was created successfully, push notification is secondary
      }
    } catch (pushError) {
      console.error('[PhoneReminder] Push notification error:', pushError);
      // Follow-up was created successfully, push notification is secondary
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Phone reminder creation failed';
    return { success: false, error: errorMessage };
  }
}
