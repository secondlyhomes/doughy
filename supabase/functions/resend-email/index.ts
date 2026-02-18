/**
 * Resend Email Edge Function
 *
 * Handles sending emails via Resend API.
 * Supports welcome, security, reminder, and test emails.
 *
 * @module resend-email
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@1.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import {
  type EmailType,
  type EmailRequestPayload,
  type EmailResponse,
  getUserEmailPreferences,
  getResendApiKey,
  getResendEmailDomain,
  logEmail,
  updateEmailLogStatus,
  generateSecurityEmailHtml,
  generateWelcomeEmailHtml,
  generateReminderEmailHtml,
  generateTestEmailHtml,
  getReminderTitle,
} from '../_shared/email/index.ts';

// =============================================================================
// Email Handlers
// =============================================================================

async function sendSecurityEmail(
  resend: Resend,
  supabase: ReturnType<typeof createClient>,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const { recipient, recipient_name, user_id, template_data, reply_to } = payload;

  if (!user_id) {
    return { success: false, error: 'User ID is required for security emails' };
  }

  const preferences = await getUserEmailPreferences(supabase, user_id);
  if (preferences.unsubscribed_all || !preferences.security_emails) {
    return { success: false, message: 'User has opted out of security emails' };
  }

  const alertType = (template_data.alert_type as string) || 'Security Alert';
  const subject = payload.subject || `Security Alert: ${alertType}`;
  const templateId = `security-${template_data.alert_type || 'generic'}`;

  const html = generateSecurityEmailHtml(
    {
      name: (recipient_name || template_data.name || 'User') as string,
      alert_type: template_data.alert_type as string,
      location: template_data.location as string,
      device: template_data.device as string,
      time: template_data.time as string,
      ip_address: template_data.ip_address as string,
      message: template_data.message as string,
      action_text: template_data.action_text as string,
      action_url: template_data.action_url as string,
    },
    domain,
    subject
  );

  try {
    const emailLogId = await logEmail(supabase, {
      userId: user_id,
      type: 'security',
      recipient,
      subject,
      templateId,
      status: 'sending',
      metadata: template_data as Record<string, unknown>,
    });

    const { data, error } = await resend.emails.send({
      from: `Doughy AI Security <security@${domain}>`,
      to: recipient,
      subject,
      html,
      reply_to: reply_to || `support@${domain}`,
      tags: [
        { name: 'email_type', value: 'security' },
        { name: 'alert_type', value: (template_data.alert_type as string) || 'generic' },
      ],
    });

    if (error) {
      if (emailLogId) {
        await updateEmailLogStatus(supabase, emailLogId, 'failed', undefined, error.message);
      }
      throw error;
    }

    // Update security event log if event_id is provided
    if (template_data.event_id) {
      await supabase
        .from('security_event_logs')
        .update({ notified: true, email_id: emailLogId })
        .eq('id', template_data.event_id);
    }

    if (emailLogId) {
      await updateEmailLogStatus(supabase, emailLogId, 'sent', data?.id);
    }

    return {
      success: true,
      message: 'Security email sent successfully',
      data: { id: data?.id, email_id: emailLogId || undefined },
    };
  } catch (error) {
    console.error('Error sending security email:', error);
    return { success: false, error: (error as Error).message || 'Failed to send security email' };
  }
}

async function sendWelcomeEmail(
  resend: Resend,
  supabase: ReturnType<typeof createClient>,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const { recipient, recipient_name, user_id, template_data, reply_to } = payload;

  if (!user_id) {
    return { success: false, error: 'User ID is required for welcome emails' };
  }

  const preferences = await getUserEmailPreferences(supabase, user_id);
  if (preferences.unsubscribed_all || !preferences.welcome_emails) {
    return { success: false, message: 'User has opted out of welcome emails' };
  }

  const subject = payload.subject || 'Welcome to Doughy AI!';
  const html = generateWelcomeEmailHtml(
    {
      name: (recipient_name || template_data.name || 'there') as string,
      verify_url: template_data.verify_url as string,
      login_url: template_data.login_url as string,
      account_url: template_data.account_url as string,
    },
    domain
  );

  try {
    const emailLogId = await logEmail(supabase, {
      userId: user_id,
      type: 'welcome',
      recipient,
      subject,
      templateId: 'welcome',
      status: 'sending',
      metadata: template_data as Record<string, unknown>,
    });

    const { data, error } = await resend.emails.send({
      from: `Doughy AI <welcome@${domain}>`,
      to: recipient,
      subject,
      html,
      reply_to: reply_to || `support@${domain}`,
      tags: [{ name: 'email_type', value: 'welcome' }],
    });

    if (error) {
      if (emailLogId) {
        await updateEmailLogStatus(supabase, emailLogId, 'failed', undefined, error.message);
      }
      throw error;
    }

    if (emailLogId) {
      await updateEmailLogStatus(supabase, emailLogId, 'sent', data?.id);
    }

    return {
      success: true,
      message: 'Welcome email sent successfully',
      data: { id: data?.id, email_id: emailLogId || undefined },
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: (error as Error).message || 'Failed to send welcome email' };
  }
}

async function sendReminderEmail(
  resend: Resend,
  supabase: ReturnType<typeof createClient>,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const { recipient, recipient_name, user_id, template_data, reply_to } = payload;

  if (!user_id) {
    return { success: false, error: 'User ID is required for reminder emails' };
  }

  const preferences = await getUserEmailPreferences(supabase, user_id);
  if (preferences.unsubscribed_all || !preferences.reminder_emails) {
    await supabase.from('user_reminder_logs').insert({
      user_id,
      reminder_type: (template_data.reminder_type as string) || 'generic',
      sent_at: new Date().toISOString(),
      action_taken: false,
      email_id: null,
    });
    return { success: false, message: 'User has opted out of reminder emails' };
  }

  const reminderType = (template_data.reminder_type as string) || 'generic';
  const templateId = `reminder-${reminderType}`;
  const reminderTitle = getReminderTitle(reminderType);
  const subject = payload.subject || `Reminder: ${reminderTitle}`;

  const html = generateReminderEmailHtml(
    {
      name: (recipient_name || template_data.name || 'there') as string,
      reminder_type: reminderType,
      message_title: (template_data.message_title as string) || reminderTitle,
      message_body: template_data.message_body as string,
      action_url: template_data.action_url as string,
      action_text: template_data.action_text as string,
      additional_content: template_data.additional_content as string,
    },
    domain,
    subject
  );

  try {
    const emailLogId = await logEmail(supabase, {
      userId: user_id,
      type: 'reminder',
      recipient,
      subject,
      templateId,
      status: 'sending',
      metadata: template_data as Record<string, unknown>,
    });

    const { data, error } = await resend.emails.send({
      from: `Doughy AI <notifications@${domain}>`,
      to: recipient,
      subject,
      html,
      reply_to: reply_to || `support@${domain}`,
      tags: [
        { name: 'email_type', value: 'reminder' },
        { name: 'reminder_type', value: reminderType },
      ],
    });

    if (error) {
      if (emailLogId) {
        await updateEmailLogStatus(supabase, emailLogId, 'failed', undefined, error.message);
      }
      throw error;
    }

    // Log the reminder
    await supabase.from('user_reminder_logs').insert({
      user_id,
      reminder_type: reminderType,
      sent_at: new Date().toISOString(),
      action_taken: false,
      email_id: emailLogId,
    });

    // Update reminder state
    const { data: reminderState } = await supabase
      .from('user_reminder_states')
      .select('id, reminder_count')
      .eq('user_id', user_id)
      .eq('reminder_type', reminderType)
      .single();

    if (reminderState) {
      await supabase
        .from('user_reminder_states')
        .update({
          reminder_count: ((reminderState.reminder_count as number) || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminderState.id);
    } else {
      await supabase.from('user_reminder_states').insert({
        user_id,
        reminder_type: reminderType,
        reminder_count: 1,
        state: template_data,
        updated_at: new Date().toISOString(),
      });
    }

    if (emailLogId) {
      await updateEmailLogStatus(supabase, emailLogId, 'sent', data?.id);
    }

    return {
      success: true,
      message: 'Reminder email sent successfully',
      data: { id: data?.id, email_id: emailLogId || undefined },
    };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: (error as Error).message || 'Failed to send reminder email' };
  }
}

async function sendTestEmail(
  resend: Resend,
  supabase: ReturnType<typeof createClient>,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const { recipient, recipient_name, template_data, reply_to } = payload;

  const subject = payload.subject || 'Doughy AI Test Email';
  const html = generateTestEmailHtml(
    {
      name: (recipient_name || template_data?.name || 'Developer') as string,
      template_data: template_data as Record<string, unknown>,
    },
    domain
  );

  try {
    const emailLogId = await logEmail(supabase, {
      userId: template_data?.user_id as string,
      type: 'test',
      recipient,
      subject,
      templateId: 'test',
      status: 'sending',
      metadata: template_data as Record<string, unknown>,
    });

    const { data, error } = await resend.emails.send({
      from: `Doughy AI Test <test@${domain}>`,
      to: recipient,
      subject,
      html,
      reply_to: reply_to || `developer@${domain}`,
      tags: [{ name: 'email_type', value: 'test' }],
    });

    if (error) {
      if (emailLogId) {
        await updateEmailLogStatus(supabase, emailLogId, 'failed', undefined, error.message);
      }
      throw error;
    }

    if (emailLogId) {
      await updateEmailLogStatus(supabase, emailLogId, 'sent', data?.id);
    }

    return {
      success: true,
      message: 'Test email sent successfully',
      data: { id: data?.id, email_id: emailLogId || undefined },
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: (error as Error).message || 'Failed to send test email' };
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY') || '';

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);
    const payload: EmailRequestPayload = await req.json();

    // Validate required fields
    if (!payload.type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email type is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!payload.recipient) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!payload.template_data) {
      payload.template_data = {};
    }

    // Get Resend API key and domain
    let resendApiKey: string;
    try {
      resendApiKey = await getResendApiKey(supabase);
    } catch (error) {
      console.error('Failed to get Resend API key:', error);
      return new Response(
        JSON.stringify({ success: false, error: (error as Error).message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const domain = await getResendEmailDomain(supabase);
    console.log(`Using email domain: ${domain}`);

    const resend = new Resend(resendApiKey);

    // Process based on email type
    let response: EmailResponse;

    switch (payload.type) {
      case 'welcome':
        response = await sendWelcomeEmail(resend, supabase, payload, domain);
        break;
      case 'security':
        response = await sendSecurityEmail(resend, supabase, payload, domain);
        break;
      case 'reminder':
        response = await sendReminderEmail(resend, supabase, payload, domain);
        break;
      case 'test':
        response = await sendTestEmail(resend, supabase, payload, domain);
        break;
      case 'marketing':
        response = { success: false, error: 'Marketing emails are not implemented in this version' };
        break;
      default:
        response = { success: false, error: `Unsupported email type: ${payload.type}` };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
