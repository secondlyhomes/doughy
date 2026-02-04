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
 *
 * @module drip-touch-executor
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleCors, addCorsHeaders } from "../_shared/cors.ts";
import {
  type ContactInfo,
  sendSMS,
  sendEmail,
  sendDirectMail,
  sendMetaDM,
  createPhoneReminder,
  personalizeMessage,
} from "../_shared/channel-executors/index.ts";

// =============================================================================
// Types
// =============================================================================

interface TouchRequest {
  enrollment_id: string;
  step_id: string;
  user_id: string;
  contact: ContactInfo;
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
        .schema('investor').from('outreach_templates')
        .select('subject, body')
        .eq('id', step.template_id)
        .single();

      if (templateError || !template) {
        console.error('[TouchExecutor] Error fetching template:', templateError);
        if (!step.message_body || step.message_body.trim() === '') {
          return addCorsHeaders(
            new Response(
              JSON.stringify({
                success: false,
                error: `Template ${step.template_id} not found and no fallback message configured`,
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        console.warn(`[TouchExecutor] Using fallback message_body instead of template ${step.template_id}`);
      } else {
        finalMessage = template.body as string;
        finalSubject = (template.subject as string) || finalSubject;
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
            error: 'Message body is empty after template resolution and personalization',
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
        mail_piece_type: step.mail_piece_type || null,
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
          touch_log_id: touchLog.id as string,
          external_message_id: smsResult.messageId,
          error: smsResult.error,
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
          touch_log_id: touchLog.id as string,
          external_message_id: emailResult.messageId,
          error: emailResult.error,
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
          touchLog.id as string
        );
        result = {
          success: mailResult.success,
          touch_log_id: touchLog.id as string,
          external_message_id: mailResult.messageId,
          error: mailResult.error,
        };

        // Update tracking number if available
        if (mailResult.trackingNumber) {
          const { error: trackingError } = await supabase
            .from('drip_touch_log')
            .update({ mail_tracking_number: mailResult.trackingNumber })
            .eq('id', touchLog.id);
          if (trackingError) {
            console.error('[TouchExecutor] Error saving tracking number:', trackingError);
          }
        }
        break;
      }

      case 'meta_dm': {
        // For Meta DM, we need the contact's Facebook PSID or Instagram ID
        const { data: contactMeta, error: contactMetaError } = await supabase
          .schema('crm').from('contacts')
          .select('metadata')
          .eq('id', contact.id)
          .single();

        if (contactMetaError && contactMetaError.code !== 'PGRST116') {
          console.error('[TouchExecutor] Error fetching contact metadata:', contactMetaError);
          result = { success: false, error: `Failed to fetch contact data: ${contactMetaError.message}` };
          break;
        }

        const metadata = contactMeta?.metadata as { facebook_psid?: string; instagram_id?: string } | null;
        const metaRecipientId = metadata?.facebook_psid || metadata?.instagram_id;

        if (!metaRecipientId) {
          result = { success: false, error: 'Contact has no Facebook/Instagram ID. They must message your page first.' };
          break;
        }

        const metaResult = await sendMetaDM(supabase, user_id, metaRecipientId, finalMessage);
        result = {
          success: metaResult.success,
          touch_log_id: touchLog.id as string,
          external_message_id: metaResult.messageId,
          error: metaResult.error,
        };
        break;
      }

      case 'phone_reminder': {
        const reminderResult = await createPhoneReminder(supabase, {
          userId: user_id,
          contactId: contact.id,
          contactName: `${contact.first_name} ${contact.last_name}`,
          contactPhone: contact.phone,
          talkingPoints: step.talking_points,
          callScript: step.call_script,
          enrollmentId: enrollment_id,
        });
        result = {
          success: reminderResult.success,
          touch_log_id: touchLog.id as string,
          error: reminderResult.error,
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
        error_message: result.error || null,
      })
      .eq('id', touchLog.id);

    const warnings: string[] = [];

    if (touchLogUpdateError) {
      console.error('[TouchExecutor] CRITICAL: Failed to update touch log:', touchLogUpdateError);
      warnings.push(`Touch log update failed: ${touchLogUpdateError.message}`);
    }

    // If successful, advance enrollment to next step
    if (result.success) {
      const { error: advanceError } = await supabase.rpc('advance_enrollment_step', {
        p_enrollment_id: enrollment_id,
        p_touch_log_id: touchLog.id,
      });

      if (advanceError) {
        console.error('[TouchExecutor] CRITICAL: Failed to advance enrollment step:', advanceError);
        await supabase
          .from('drip_touch_log')
          .update({ error_message: `Message sent but step advancement failed: ${advanceError.message}` })
          .eq('id', touchLog.id);

        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              message_sent: true,
              advancement_failed: true,
              touch_log_id: touchLog.id,
              error: `Message sent but enrollment advancement failed: ${advanceError.message}`,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      // Update contact's campaign touch tracking
      const { error: touchUpdateError } = await supabase.rpc('increment_contact_touches', {
        p_contact_id: contact.id,
        p_touch_time: now,
      });

      if (touchUpdateError) {
        console.error('[TouchExecutor] Error updating contact touches:', touchUpdateError);
        warnings.push(`Contact touch tracking failed: ${touchUpdateError.message}`);
      }
    }

    const responsePayload = warnings.length > 0 ? { ...result, warnings } : result;

    return addCorsHeaders(
      new Response(JSON.stringify(responsePayload), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }),
      req
    );
  } catch (error) {
    console.error('[TouchExecutor] Error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: (error as Error).message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
