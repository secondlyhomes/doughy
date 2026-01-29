/**
 * Drip Touch Executor Edge Function
 *
 * Sends drip campaign messages via the appropriate channel:
 * - SMS: Via Twilio
 * - Email: Via Resend
 * - Direct Mail: Via PostGrid
 * - Meta DM: Via Facebook/Instagram Graph API
 * - Phone Reminder: Creates notification for user to call
 *
 * Called by drip-campaign-processor for each due enrollment.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface TouchRequest {
  enrollment_id: string;
  step_id: string;
  user_id: string;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  step: {
    channel: 'sms' | 'email' | 'direct_mail' | 'meta_dm' | 'phone_reminder';
    subject?: string;
    message_body?: string;
    template_id?: string;
    use_ai_generation?: boolean;
    ai_tone?: string;
    mail_piece_type?: string;
    mail_template_id?: string;
    talking_points?: string[];
    call_script?: string;
  };
  context?: {
    property_address?: string;
    pain_points?: string[];
    last_conversation?: string;
  };
}

interface TouchResult {
  success: boolean;
  touch_log_id?: string;
  external_message_id?: string;
  error?: string;
}

// Mail piece pricing (cost in credits)
const MAIL_PRICING: Record<string, number> = {
  'postcard_4x6': 1.49,
  'postcard_6x9': 1.99,
  'postcard_6x11': 2.49,
  'yellow_letter': 2.99,
  'letter_1_page': 2.49,
  'letter_2_page': 3.49,
};

/**
 * Sanitize user input for safe HTML embedding
 */
function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// =============================================================================
// Channel Executors
// =============================================================================

/**
 * Send SMS via Twilio
 */
async function sendSMS(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
    const url = `https://api.twilio.com/2010-04-01/Accounts/${credentials.account_sid}/Messages.json`;
    const auth = btoa(`${credentials.account_sid}:${credentials.auth_token}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: credentials.phone_number,
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
    return { success: false, error: error.message };
  }
}

/**
 * Send Email via Resend
 */
async function sendEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
    console.warn('[TouchExecutor] Error fetching user profile, using defaults:', profileError);
  }

  const fromName = profile?.business_name || profile?.full_name || 'Doughy';
  const fromEmail = profile?.email || 'noreply@doughy.app';

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
        // Can add HTML later
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Resend error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send Direct Mail via PostGrid
 */
async function sendDirectMail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contact: TouchRequest['contact'],
  mailPieceType: string,
  templateId: string | undefined,
  messageBody: string | undefined,
  touchLogId: string
): Promise<{ success: boolean; messageId?: string; trackingNumber?: string; error?: string }> {
  const postgridApiKey = Deno.env.get('POSTGRID_API_KEY');

  if (!postgridApiKey) {
    return { success: false, error: 'PostGrid API key not configured' };
  }

  // Get mail piece cost
  const cost = MAIL_PRICING[mailPieceType] || 1.49;

  // Check and deduct credits
  const { data: deducted, error: deductError } = await supabase
    .rpc('deduct_mail_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_touch_log_id: touchLogId,
      p_mail_piece_type: mailPieceType,
      p_pieces_count: 1,
      p_description: `Direct mail to ${contact.first_name} ${contact.last_name}`
    });

  if (deductError || !deducted) {
    return { success: false, error: 'Insufficient mail credits' };
  }

  // Get user's return address
  const { data: postgridCreds } = await supabase
    .from('postgrid_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!postgridCreds || !contact.address) {
    // Refund credits if no address
    const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
      p_user_id: userId,
      p_amount: cost,
      p_reason: 'Address not configured'
    });
    if (refundError) {
      console.error('[TouchExecutor] CRITICAL: Failed to refund credits for missing address:', refundError);
      return { success: false, error: `Address not configured and credit refund failed: ${refundError.message}. Contact support.` };
    }
    return { success: false, error: 'Address not configured for mail' };
  }

  try {
    // Determine PostGrid endpoint based on piece type
    const isLetter = mailPieceType.includes('letter');
    const endpoint = isLetter
      ? 'https://api.postgrid.com/print-mail/v1/letters'
      : 'https://api.postgrid.com/print-mail/v1/postcards';

    const payload: Record<string, unknown> = {
      to: {
        firstName: contact.first_name,
        lastName: contact.last_name,
        addressLine1: contact.address.line1,
        addressLine2: contact.address.line2 || '',
        city: contact.address.city,
        provinceOrState: contact.address.state,
        postalOrZip: contact.address.zip,
        country: 'US'
      },
      from: {
        firstName: postgridCreds.return_name,
        companyName: postgridCreds.return_company,
        addressLine1: postgridCreds.return_address_line1,
        addressLine2: postgridCreds.return_address_line2 || '',
        city: postgridCreds.return_city,
        provinceOrState: postgridCreds.return_state,
        postalOrZip: postgridCreds.return_zip,
        country: 'US'
      },
      mailClass: postgridCreds.default_mail_class || 'first_class'
    };

    // Add template or content
    if (templateId) {
      payload.template = templateId;
    } else if (messageBody) {
      // Sanitize user content to prevent HTML injection
      const sanitizedMessage = sanitizeHtml(messageBody);
      // For letters, use HTML content
      if (isLetter) {
        payload.html = `<html><body style="font-family: Arial, sans-serif; padding: 1in;"><p>${sanitizedMessage.replace(/\n/g, '<br>')}</p></body></html>`;
      } else {
        // For postcards, front/back
        payload.frontHtml = `<div style="padding: 20px;"><p>${sanitizedMessage.replace(/\n/g, '<br>')}</p></div>`;
      }
    }

    // Set postcard size
    if (!isLetter) {
      const sizeMap: Record<string, string> = {
        'postcard_4x6': '4x6',
        'postcard_6x9': '6x9',
        'postcard_6x11': '6x11'
      };
      payload.size = sizeMap[mailPieceType] || '4x6';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': postgridApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Refund credits on failure
      const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
        p_user_id: userId,
        p_amount: cost,
        p_reason: `PostGrid error: ${response.status}`
      });
      if (refundError) {
        console.error('[TouchExecutor] CRITICAL: Failed to refund credits after PostGrid error:', refundError);
        return { success: false, error: `PostGrid error: ${response.status}. Credit refund failed - contact support.` };
      }
      return { success: false, error: `PostGrid error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.data?.id,
      trackingNumber: result.data?.trackingNumber
    };

  } catch (error) {
    // Refund credits on error
    const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
      p_user_id: userId,
      p_amount: cost,
      p_reason: `Error: ${error.message}`
    });
    if (refundError) {
      console.error('[TouchExecutor] CRITICAL: Failed to refund credits after error:', refundError);
      return { success: false, error: `${error.message}. Credit refund failed - contact support.` };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Send Meta DM (Facebook/Instagram)
 * Uses atomic rate limit check to prevent race conditions
 */
async function sendMetaDM(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  recipientId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string; rateLimitWarning?: boolean }> {
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
  let hourlyCount = credentials.hourly_dm_count || 0;
  let dailyCount = credentials.daily_dm_count || 0;

  // Check hourly reset
  if (credentials.hourly_dm_reset_at) {
    const hourlyReset = new Date(credentials.hourly_dm_reset_at);
    if (now >= hourlyReset) {
      hourlyCount = 0;
    }
  }

  // Check daily reset
  if (credentials.daily_dm_reset_at) {
    const dailyReset = new Date(credentials.daily_dm_reset_at);
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
    // Send message with access token in body (not URL) for security
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${credentials.page_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: credentials.page_access_token,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Meta API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();

    // Update rate limit counters AFTER successful send (prevents race condition)
    const hourlyResetAt = credentials.hourly_dm_reset_at && new Date(credentials.hourly_dm_reset_at) > now
      ? credentials.hourly_dm_reset_at
      : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const dailyResetAt = credentials.daily_dm_reset_at && new Date(credentials.daily_dm_reset_at) > now
      ? credentials.daily_dm_reset_at
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { error: rateLimitError } = await supabase
      .from('meta_dm_credentials')
      .update({
        hourly_dm_count: hourlyCount + 1,
        hourly_dm_reset_at: hourlyResetAt,
        daily_dm_count: dailyCount + 1,
        daily_dm_reset_at: dailyResetAt,
        updated_at: now.toISOString()
      })
      .eq('id', credentials.id);

    let rateLimitWarning = false;
    if (rateLimitError) {
      console.error('[TouchExecutor] Error updating Meta DM rate limit counters:', rateLimitError);
      rateLimitWarning = true;
      // Message was sent - this is non-critical but could cause rate limit tracking drift
    }

    return { success: true, messageId: result.message_id, rateLimitWarning };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create phone reminder notification
 */
async function createPhoneReminder(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contactId: string,
  contactName: string,
  contactPhone: string,
  talkingPoints: string[] | undefined,
  callScript: string | undefined,
  enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create a follow-up record for the phone call
    const { data: followUp, error: followUpError } = await supabase
      .from('investor_follow_ups')
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
          talking_points: talkingPoints
        }
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
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SECRET_KEY')}`
        },
        body: JSON.stringify({
          user_id: userId,
          title: `Call Reminder: ${contactName}`,
          body: `Time to call ${contactName} at ${contactPhone}`,
          data: {
            type: 'phone_reminder',
            contact_id: contactId,
            follow_up_id: followUp.id,
            phone: contactPhone
          }
        })
      });

      if (!pushResponse.ok) {
        console.error('[TouchExecutor] Push notification failed:', pushResponse.status, await pushResponse.text());
        // Follow-up was created successfully, push notification is secondary
        // Return success but note the push failure
      }
    } catch (pushError) {
      console.error('[TouchExecutor] Push notification error:', pushError);
      // Follow-up was created successfully, push notification is secondary
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============================================================================
// Message Personalization
// =============================================================================

function personalizeMessage(
  template: string,
  contact: TouchRequest['contact'],
  context?: TouchRequest['context']
): string {
  let message = template;

  // Basic contact variables
  message = message.replace(/\{first_name\}/g, contact.first_name || 'there');
  message = message.replace(/\{last_name\}/g, contact.last_name || '');
  message = message.replace(/\{full_name\}/g,
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'there'
  );

  // Context variables
  if (context) {
    if (context.property_address) {
      message = message.replace(/\{property_address\}/g, context.property_address);
    }
  }

  return message;
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Parse request
    const body: TouchRequest = await req.json();
    const { enrollment_id, step_id, user_id, contact, step, context } = body;

    if (!enrollment_id || !step_id || !user_id || !contact || !step) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Personalize message
    let finalMessage = step.message_body || '';
    let finalSubject = step.subject || '';

    // If using template, fetch it
    if (step.template_id) {
      const { data: template, error: templateError } = await supabase
        .from('investor_outreach_templates')
        .select('subject, body')
        .eq('id', step.template_id)
        .single();

      if (templateError || !template) {
        console.error('[TouchExecutor] Error fetching template:', templateError);
        // If no fallback message exists, fail the touch
        if (!step.message_body || step.message_body.trim() === '') {
          return addCorsHeaders(
            new Response(
              JSON.stringify({
                success: false,
                error: `Template ${step.template_id} not found and no fallback message configured`
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        // Use fallback but log warning
        console.warn(`[TouchExecutor] Using fallback message_body instead of template ${step.template_id}`);
      } else {
        finalMessage = template.body;
        finalSubject = template.subject || finalSubject;
      }
    }

    // Apply personalization
    finalMessage = personalizeMessage(finalMessage, contact, context);
    finalSubject = personalizeMessage(finalSubject, contact, context);

    // Validate message body is not empty for channels that need it
    if (step.channel !== 'phone_reminder' && (!finalMessage || finalMessage.trim() === '')) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Message body is empty after template resolution and personalization'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Create touch log entry
    const { data: touchLog, error: touchLogError } = await supabase
      .from('drip_touch_log')
      .insert({
        user_id,
        enrollment_id,
        step_id,
        channel: step.channel,
        status: 'sending',
        subject: finalSubject || null,
        message_body: finalMessage,
        recipient_phone: contact.phone,
        recipient_email: contact.email,
        recipient_address: contact.address || null,
        scheduled_at: new Date().toISOString(),
        mail_piece_type: step.mail_piece_type || null
      })
      .select()
      .single();

    if (touchLogError || !touchLog) {
      console.error('[TouchExecutor] Error creating touch log:', touchLogError);
      throw new Error('Failed to create touch log');
    }

    let result: TouchResult = { success: false };

    // Execute based on channel
    switch (step.channel) {
      case 'sms': {
        if (!contact.phone) {
          result = { success: false, error: 'No phone number for contact' };
          break;
        }
        const smsResult = await sendSMS(supabase, user_id, contact.phone, finalMessage);
        result = {
          success: smsResult.success,
          touch_log_id: touchLog.id,
          external_message_id: smsResult.messageId,
          error: smsResult.error
        };
        break;
      }

      case 'email': {
        if (!contact.email) {
          result = { success: false, error: 'No email for contact' };
          break;
        }
        const emailResult = await sendEmail(supabase, user_id, contact.email, finalSubject, finalMessage);
        result = {
          success: emailResult.success,
          touch_log_id: touchLog.id,
          external_message_id: emailResult.messageId,
          error: emailResult.error
        };
        break;
      }

      case 'direct_mail': {
        if (!contact.address) {
          result = { success: false, error: 'No address for contact' };
          break;
        }
        const mailResult = await sendDirectMail(
          supabase,
          user_id,
          contact,
          step.mail_piece_type || 'postcard_4x6',
          step.mail_template_id,
          finalMessage,
          touchLog.id
        );
        result = {
          success: mailResult.success,
          touch_log_id: touchLog.id,
          external_message_id: mailResult.messageId,
          error: mailResult.error
        };

        // Update tracking number if available
        if (mailResult.trackingNumber) {
          const { error: trackingError } = await supabase
            .from('drip_touch_log')
            .update({ mail_tracking_number: mailResult.trackingNumber })
            .eq('id', touchLog.id);
          if (trackingError) {
            console.error('[TouchExecutor] Error saving tracking number:', trackingError);
            // Non-critical - mail was sent, continue
          }
        }
        break;
      }

      case 'meta_dm': {
        // For Meta DM, we need the contact's Facebook PSID or Instagram ID
        // Fetch from contact metadata
        const { data: contactMeta, error: contactMetaError } = await supabase
          .from('crm_contacts')
          .select('metadata')
          .eq('id', contact.id)
          .single();

        // Check for actual database errors (not just "not found")
        if (contactMetaError && contactMetaError.code !== 'PGRST116') {
          console.error('[TouchExecutor] Error fetching contact metadata:', contactMetaError);
          result = { success: false, error: `Failed to fetch contact data: ${contactMetaError.message}` };
          break;
        }

        const metaRecipientId = (contactMeta?.metadata as { facebook_psid?: string; instagram_id?: string } | null)?.facebook_psid
          || (contactMeta?.metadata as { facebook_psid?: string; instagram_id?: string } | null)?.instagram_id;

        if (!metaRecipientId) {
          result = { success: false, error: 'Contact has no Facebook/Instagram ID. They must message your page first.' };
          break;
        }

        const metaResult = await sendMetaDM(supabase, user_id, metaRecipientId, finalMessage);
        result = {
          success: metaResult.success,
          touch_log_id: touchLog.id,
          external_message_id: metaResult.messageId,
          error: metaResult.error
        };
        break;
      }

      case 'phone_reminder': {
        const reminderResult = await createPhoneReminder(
          supabase,
          user_id,
          contact.id,
          `${contact.first_name} ${contact.last_name}`,
          contact.phone,
          step.talking_points,
          step.call_script,
          enrollment_id
        );
        result = {
          success: reminderResult.success,
          touch_log_id: touchLog.id,
          error: reminderResult.error
        };
        break;
      }

      default:
        result = { success: false, error: `Unknown channel: ${step.channel}` };
    }

    // Update touch log with result
    const now = new Date().toISOString();
    const { error: touchLogUpdateError } = await supabase
      .from('drip_touch_log')
      .update({
        status: result.success ? 'sent' : 'failed',
        external_message_id: result.external_message_id || null,
        sent_at: result.success ? now : null,
        failed_at: result.success ? null : now,
        error_message: result.error || null
      })
      .eq('id', touchLog.id);

    // Track warnings to include in response
    const warnings: string[] = [];

    if (touchLogUpdateError) {
      console.error('[TouchExecutor] CRITICAL: Failed to update touch log:', touchLogUpdateError);
      warnings.push(`Touch log update failed: ${touchLogUpdateError.message}`);
    }

    // If successful, advance enrollment to next step
    if (result.success) {
      const { error: advanceError } = await supabase.rpc('advance_enrollment_step', {
        p_enrollment_id: enrollment_id,
        p_touch_log_id: touchLog.id
      });

      if (advanceError) {
        console.error('[TouchExecutor] CRITICAL: Failed to advance enrollment step:', advanceError);
        // Mark the touch log to indicate advancement failure
        await supabase
          .from('drip_touch_log')
          .update({
            error_message: `Message sent but step advancement failed: ${advanceError.message}`
          })
          .eq('id', touchLog.id);

        // Return failure with context so processor knows to investigate
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              message_sent: true,
              advancement_failed: true,
              touch_log_id: touchLog.id,
              error: `Message sent but enrollment advancement failed: ${advanceError.message}`
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      // Update contact's campaign touch tracking using RPC to handle atomic increment
      const { error: touchUpdateError } = await supabase.rpc('increment_contact_touches', {
        p_contact_id: contact.id,
        p_touch_time: now
      });

      if (touchUpdateError) {
        // Non-critical for message delivery, log but continue
        console.error('[TouchExecutor] Error updating contact touches:', touchUpdateError);
        warnings.push(`Contact touch tracking failed: ${touchUpdateError.message}`);
      }
    }

    // Include warnings in response if any occurred
    const responsePayload = warnings.length > 0
      ? { ...result, warnings }
      : result;

    return addCorsHeaders(
      new Response(
        JSON.stringify(responsePayload),
        { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[TouchExecutor] Error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
