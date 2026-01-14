// Supabase Edge Function: resend-email
// Handles sending emails via Resend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@1.1.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import { decryptServer } from '../_shared/crypto-server.ts';

// Email types supported by this endpoint
type EmailType = 'welcome' | 'security' | 'reminder' | 'marketing' | 'test';

// Main request payload structure
interface EmailRequestPayload {
  type: EmailType;
  recipient: string;
  recipient_name?: string;
  subject?: string; // Optional - templates have default subjects
  template_data: Record<string, any>;
  user_id?: string; // Required for tracking but optional for test emails
  reply_to?: string;
}

// Response structure
interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id?: string;
    email_id?: string;
  };
}

// Helper to get email preferences for a user
async function getUserEmailPreferences(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching email preferences:', error);
    // Default to allowing all emails if we can't fetch preferences
    return {
      welcome_emails: true,
      security_emails: true,
      reminder_emails: true,
      marketing_emails: false, // Default marketing to false for safety
      unsubscribed_all: false
    };
  }

  return data || {
    welcome_emails: true,
    security_emails: true,
    reminder_emails: true,
    marketing_emails: false,
    unsubscribed_all: false
  };
}

// Get Resend API key from database
async function getResendApiKey(supabase: any) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_ciphertext')
    .or('service.eq.resend,service.eq.resend-key')
    .single();

  if (error || !data?.key_ciphertext) {
    console.error('Error fetching Resend API key:', error);
    throw new Error('Resend API key not configured');
  }

  // Decrypt the API key
  try {
    const decryptedKey = await decryptServer(data.key_ciphertext);
    console.log('Successfully retrieved and decrypted Resend API key from database');
    return decryptedKey;
  } catch (decryptError) {
    console.error('Error decrypting Resend API key:', decryptError);
    throw new Error('Failed to decrypt Resend API key');
  }
}

// Get Resend email domain from system settings
async function getResendEmailDomain(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'resend_email_domain')
      .single();

    if (error) throw error;
    
    // Handle both string and JSONB value formats
    if (data?.value) {
      let domainValue = data.value;
      
      // Log the raw value for debugging
      console.log('Raw domain value:', JSON.stringify(data.value));
      
      // If value is a string that might be JSON
      if (typeof domainValue === 'string') {
        try {
          // Try to parse as JSON
          const parsedValue = JSON.parse(domainValue);
          if (typeof parsedValue === 'string') {
            // If it's a JSON string, use the parsed value
            console.log('Using parsed JSON string domain:', parsedValue);
            return parsedValue;
          }
        } catch (e) {
          // Not JSON, use as is
          console.log('Using string domain (not JSON):', domainValue);
          return domainValue;
        }
      } else if (typeof domainValue === 'object') {
        // If it's already a parsed object (from JSONB column)
        console.log('Using object domain:', String(domainValue));
        return String(domainValue);
      }
      
      // If we get here, just use the value directly
      return domainValue;
    }
    
    // Return default domain if no value found
    console.log('No domain found, using default: doughy.ai');
    return 'doughy.ai';
  } catch (error) {
    console.error('Error fetching Resend email domain:', error);
    // Default domain as fallback
    return 'doughy.ai';
  }
}

// Log email to database
async function logEmail(
  supabase: any,
  userId: string | undefined,
  type: EmailType,
  recipient: string,
  subject: string,
  templateId: string,
  status: string,
  resendId?: string,
  metadata?: Record<string, any>
) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: type,
        recipient,
        subject,
        template_id: templateId,
        status,
        external_id: resendId,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging email:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('Exception logging email:', error);
    return null;
  }
}

// Handle security email requests
async function sendSecurityEmail(
  resend: Resend,
  supabase: any,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const {
    recipient,
    recipient_name,
    user_id,
    template_data,
    reply_to
  } = payload;

  if (!user_id) {
    return {
      success: false,
      error: 'User ID is required for security emails'
    };
  }

  // Check user preferences
  const preferences = await getUserEmailPreferences(supabase, user_id);
  
  if (preferences.unsubscribed_all || !preferences.security_emails) {
    return {
      success: false,
      message: 'User has opted out of security emails'
    };
  }

  // Security emails cannot be unsubscribed from individually
  // But we respect the global unsubscribe setting

  // Default subject based on alert type
  const alertType = template_data.alert_type || 'Security Alert';
  const subject = payload.subject || `Security Alert: ${alertType}`;
  
  // We'll use different templates based on the security alert type
  const templateId = `security-${template_data.alert_type || 'generic'}`;

  // Create basic security email HTML
  const name = recipient_name || template_data.name || 'User';
  const location = template_data.location || 'Unknown location';
  const device = template_data.device || 'Unknown device';
  const time = template_data.time || new Date().toLocaleString();
  const ipAddress = template_data.ip_address || 'Unknown IP';
  
  const actionText = template_data.action_text || "Review Account Activity";
  const actionUrl = template_data.action_url || `https://app.${domain}/settings/security`;

  // Basic security email template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #dc3545;">${subject}</h2>
        <p>Hi ${name},</p>
        <p>We detected a ${template_data.alert_type || 'security event'} on your Doughy AI account.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3>Event Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong> ${time}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong> ${location}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Device:</strong> ${device}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>IP Address:</strong> ${ipAddress}</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p>${template_data.message || "If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication if you haven't already."}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #0d6efd; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">${actionText}</a>
      </div>
      
      <div style="font-size: 14px; color: #6c757d; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
        <p>This is an automated security alert from Doughy AI. Please do not reply to this email.</p>
        <p>If you need assistance, please contact our support team at <a href="mailto:support@${domain}" style="color: #0d6efd;">support@${domain}</a>.</p>
      </div>
    </body>
    </html>
  `;

  try {
    // Log the email first with status 'sending'
    const emailLogId = await logEmail(
      supabase,
      user_id,
      'security',
      recipient,
      subject,
      templateId,
      'sending',
      undefined,
      template_data
    );

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `Doughy AI Security <security@${domain}>`,
      to: recipient,
      subject: subject,
      html: html,
      reply_to: reply_to || `support@${domain}`,
      tags: [
        { name: 'email_type', value: 'security' },
        { name: 'alert_type', value: template_data.alert_type || 'generic' }
      ]
    });

    if (error) {
      // Update log with error status
      if (emailLogId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            metadata: { ...template_data, error: error.message }
          })
          .eq('id', emailLogId);
      }

      throw error;
    }

    // Update security event log if event_id is provided
    if (template_data.event_id) {
      await supabase
        .from('security_event_logs')
        .update({
          notified: true,
          email_id: emailLogId
        })
        .eq('id', template_data.event_id);
    }

    // Update log with success status
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          external_id: data?.id
        })
        .eq('id', emailLogId);
    }

    return {
      success: true,
      message: 'Security email sent successfully',
      data: {
        id: data?.id,
        email_id: emailLogId
      }
    };
  } catch (error) {
    console.error('Error sending security email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send security email'
    };
  }
}

// Handle welcome email requests
async function sendWelcomeEmail(
  resend: Resend,
  supabase: any,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const {
    recipient,
    recipient_name,
    user_id,
    template_data,
    reply_to
  } = payload;

  if (!user_id) {
    return {
      success: false,
      error: 'User ID is required for welcome emails'
    };
  }

  // Check user preferences
  const preferences = await getUserEmailPreferences(supabase, user_id);
  
  if (preferences.unsubscribed_all || !preferences.welcome_emails) {
    return {
      success: false,
      message: 'User has opted out of welcome emails'
    };
  }

  // Default subject
  const subject = payload.subject || 'Welcome to Doughy AI!';
  
  // Template ID
  const templateId = 'welcome';

  // Create welcome email HTML
  const name = recipient_name || template_data.name || 'there';
  const verifyUrl = template_data.verify_url || `https://app.${domain}/verify-email`;
  const loginUrl = template_data.login_url || `https://app.${domain}/login`;
  const accountUrl = template_data.account_url || `https://app.${domain}/settings`;
  
  // Basic welcome email template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Welcome to Doughy AI</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="max-width: 180px;">
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px;">
        <h1 style="margin-top: 0; color: #212529;">Welcome to Doughy AI!</h1>
        <p style="font-size: 18px;">Hi ${name},</p>
        <p style="font-size: 16px;">Thank you for joining Doughy AI. We're excited to have you on board!</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #343a40; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Getting Started</h2>
        <p>Here are a few things you can do right away:</p>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 10px;"><strong>Verify your email</strong> to ensure account security</li>
          <li style="margin-bottom: 10px;"><strong>Complete your profile</strong> to personalize your experience</li>
          <li style="margin-bottom: 10px;"><strong>Explore the dashboard</strong> to see what Doughy AI can do for you</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 15px;">Verify Your Email</a>
        <p style="font-size: 14px; color: #6c757d;">This verification link will expire in 24 hours.</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <h3 style="margin-top: 0;">Need Help?</h3>
        <p>Our support team is always ready to assist you. Feel free to reach out if you have any questions.</p>
        <p><a href="mailto:support@${domain}" style="color: #0d6efd;">support@${domain}</a></p>
      </div>
      
      <div style="font-size: 14px; color: #6c757d; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
        <p>You're receiving this email because you recently created an account on Doughy AI.</p>
        <p>© ${new Date().getFullYear()} Doughy AI. All rights reserved.</p>
        <p>
          <a href="${loginUrl}" style="color: #0d6efd; margin: 0 10px;">Login</a> |
          <a href="${accountUrl}" style="color: #0d6efd; margin: 0 10px;">Account Settings</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    // Log the email first with status 'sending'
    const emailLogId = await logEmail(
      supabase,
      user_id,
      'welcome',
      recipient,
      subject,
      templateId,
      'sending',
      undefined,
      template_data
    );

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `Doughy AI <welcome@${domain}>`,
      to: recipient,
      subject: subject,
      html: html,
      reply_to: reply_to || `support@${domain}`,
      tags: [
        { name: 'email_type', value: 'welcome' }
      ]
    });

    if (error) {
      // Update log with error status
      if (emailLogId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            metadata: { ...template_data, error: error.message }
          })
          .eq('id', emailLogId);
      }

      throw error;
    }

    // Update log with success status
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          external_id: data?.id
        })
        .eq('id', emailLogId);
    }

    return {
      success: true,
      message: 'Welcome email sent successfully',
      data: {
        id: data?.id,
        email_id: emailLogId
      }
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email'
    };
  }
}

// Handle reminder email requests
async function sendReminderEmail(
  resend: Resend,
  supabase: any,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const {
    recipient,
    recipient_name,
    user_id,
    template_data,
    reply_to
  } = payload;

  if (!user_id) {
    return {
      success: false,
      error: 'User ID is required for reminder emails'
    };
  }

  // Check user preferences
  const preferences = await getUserEmailPreferences(supabase, user_id);
  
  if (preferences.unsubscribed_all || !preferences.reminder_emails) {
    // Log the skipped reminder
    await supabase
      .from('reminder_logs')
      .insert({
        user_id: user_id,
        reminder_type: template_data.reminder_type || 'generic',
        sent_at: new Date().toISOString(),
        action_taken: false,
        email_id: null
      });
    
    return {
      success: false,
      message: 'User has opted out of reminder emails'
    };
  }

  // Set template based on reminder type
  const reminderType = template_data.reminder_type || 'generic';
  const templateId = `reminder-${reminderType}`;

  // Default subject based on reminder type
  let reminderTitle = 'Action Required';
  switch (reminderType) {
    case 'email_verification':
      reminderTitle = 'Verify Your Email';
      break;
    case 'onboarding':
      reminderTitle = 'Complete Your Onboarding';
      break;
    case 'profile':
      reminderTitle = 'Complete Your Profile';
      break;
    case 'subscription':
      reminderTitle = 'Subscription Expiring Soon';
      break;
    case 'document':
      reminderTitle = 'Document Update Needed';
      break;
  }

  const subject = payload.subject || `Reminder: ${reminderTitle}`;

  // Basic reminder email template vars
  const name = recipient_name || template_data.name || 'there';
  const actionUrl = template_data.action_url || `https://app.${domain}/`;
  const actionText = template_data.action_text || 'Take Action';
  const messageTitle = template_data.message_title || reminderTitle;
  const messageBody = template_data.message_body || 'This is a reminder to complete this action on your Doughy AI account.';
  
  // Create HTML for reminder email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #0d6efd;">Reminder: ${messageTitle}</h2>
        <p>Hi ${name},</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p>${messageBody}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: #0d6efd; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">${actionText}</a>
      </div>
      
      ${template_data.additional_content || ''}
      
      <div style="font-size: 14px; color: #6c757d; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
        <p>This is an automated reminder from Doughy AI. If you've already taken action, please disregard this email.</p>
        <p>If you need assistance, please contact our support team at <a href="mailto:support@${domain}" style="color: #0d6efd;">support@${domain}</a>.</p>
        <p>
          <a href="https://app.${domain}/settings/emails" style="color: #6c757d;">Email Preferences</a> |
          <a href="https://app.${domain}/settings/emails/unsubscribe" style="color: #6c757d;">Unsubscribe</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    // Log the email first with status 'sending'
    const emailLogId = await logEmail(
      supabase,
      user_id,
      'reminder',
      recipient,
      subject,
      templateId,
      'sending',
      undefined,
      template_data
    );

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `Doughy AI <notifications@${domain}>`,
      to: recipient,
      subject: subject,
      html: html,
      reply_to: reply_to || `support@${domain}`,
      tags: [
        { name: 'email_type', value: 'reminder' },
        { name: 'reminder_type', value: reminderType }
      ]
    });

    if (error) {
      // Update log with error status
      if (emailLogId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            metadata: { ...template_data, error: error.message }
          })
          .eq('id', emailLogId);
      }

      throw error;
    }

    // Log the reminder
    const reminderLogId = await supabase
      .from('reminder_logs')
      .insert({
        user_id: user_id,
        reminder_type: reminderType,
        sent_at: new Date().toISOString(),
        action_taken: false,
        email_id: emailLogId
      })
      .select('id')
      .single();

    // Update reminder state if it exists
    const { data: reminderState } = await supabase
      .from('reminder_states')
      .select('id, reminder_count')
      .eq('user_id', user_id)
      .eq('reminder_type', reminderType)
      .single();

    if (reminderState) {
      // Update existing reminder state
      await supabase
        .from('reminder_states')
        .update({
          reminder_count: (reminderState.reminder_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderState.id);
    } else {
      // Create new reminder state
      await supabase
        .from('reminder_states')
        .insert({
          user_id: user_id,
          reminder_type: reminderType,
          reminder_count: 1,
          state: template_data,
          updated_at: new Date().toISOString()
        });
    }

    // Update email log with success status
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          external_id: data?.id
        })
        .eq('id', emailLogId);
    }

    return {
      success: true,
      message: 'Reminder email sent successfully',
      data: {
        id: data?.id,
        email_id: emailLogId
      }
    };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send reminder email'
    };
  }
}

// Handle test email requests
async function sendTestEmail(
  resend: Resend,
  supabase: any,
  payload: EmailRequestPayload,
  domain: string
): Promise<EmailResponse> {
  const {
    recipient,
    recipient_name,
    template_data,
    reply_to
  } = payload;

  // For test emails, we want a simple template that shows it's working
  const subject = payload.subject || 'Doughy AI Test Email';
  const name = recipient_name || template_data?.name || 'Developer';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="max-width: 150px;">
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-top: 0;">Test Email</h1>
        <p>Hello ${name},</p>
        <p>This is a test email from Doughy AI's Resend integration.</p>
        <p>If you're seeing this, the email service is working correctly!</p>
      </div>
      
      <div style="background-color: #e9f7fe; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Template Data:</h3>
        <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 3px; overflow: auto;">${JSON.stringify(template_data || {}, null, 2)}</pre>
      </div>
      
      <div style="font-size: 14px; color: #6c757d; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
        <p>This is a test email from the Resend email integration.</p>
        <p>© ${new Date().getFullYear()} Doughy AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  try {
    // For test emails, we still log but mark them as test
    const emailLogId = await logEmail(
      supabase,
      template_data?.user_id,
      'test',
      recipient,
      subject,
      'test',
      'sending',
      undefined,
      template_data
    );

    // Send the test email
    const { data, error } = await resend.emails.send({
      from: `Doughy AI Test <test@${domain}>`,
      to: recipient,
      subject: subject,
      html: html,
      reply_to: reply_to || `developer@${domain}`,
      tags: [{ name: 'email_type', value: 'test' }]
    });

    if (error) {
      // Update log with error status
      if (emailLogId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            metadata: { ...template_data, error: error.message }
          })
          .eq('id', emailLogId);
      }

      throw error;
    }

    // Update log with success status
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          external_id: data?.id
        })
        .eq('id', emailLogId);
    }

    return {
      success: true,
      message: 'Test email sent successfully',
      data: {
        id: data?.id,
        email_id: emailLogId
      }
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send test email'
    };
  }
}

// Handle all requests to the function
serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request payload
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
      payload.template_data = {}; // Initialize to empty object if not provided
    }
    
    // Get Resend API key from database
    let resendApiKey: string;
    try {
      resendApiKey = await getResendApiKey(supabase);
    } catch (error) {
      console.error('Failed to get Resend API key:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get email domain from database settings
    const domain = await getResendEmailDomain(supabase);
    console.log(`Using email domain: ${domain}`);
    
    // Initialize Resend client
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
        // Not implemented in MVP
        response = {
          success: false,
          error: 'Marketing emails are not implemented in this version'
        };
        break;
      default:
        response = {
          success: false,
          error: `Unsupported email type: ${payload.type}`
        };
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.success ? 200 : 400 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});