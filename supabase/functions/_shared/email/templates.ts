/**
 * Email Templates Module
 *
 * HTML email templates for various email types.
 *
 * @module _shared/email/templates
 */

// =============================================================================
// Template Types
// =============================================================================

export interface SecurityEmailData {
  name: string;
  alert_type?: string;
  location?: string;
  device?: string;
  time?: string;
  ip_address?: string;
  message?: string;
  action_text?: string;
  action_url?: string;
}

export interface WelcomeEmailData {
  name: string;
  verify_url?: string;
  login_url?: string;
  account_url?: string;
}

export interface ReminderEmailData {
  name: string;
  reminder_type?: string;
  message_title?: string;
  message_body?: string;
  action_url?: string;
  action_text?: string;
  additional_content?: string;
}

export interface TestEmailData {
  name: string;
  template_data?: Record<string, unknown>;
}

// =============================================================================
// Common Styles
// =============================================================================

const COMMON_STYLES = {
  body: "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;",
  logo: "max-width: 150px;",
  logoLarge: "max-width: 180px;",
  button: "padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;",
  footer: "font-size: 14px; color: #6c757d; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;",
};

// =============================================================================
// Security Email Template
// =============================================================================

export function generateSecurityEmailHtml(
  data: SecurityEmailData,
  domain: string,
  subject: string
): string {
  const {
    name = 'User',
    alert_type = 'security event',
    location = 'Unknown location',
    device = 'Unknown device',
    time = new Date().toLocaleString(),
    ip_address = 'Unknown IP',
    message,
    action_text = 'Review Account Activity',
    action_url,
  } = data;

  const finalActionUrl = action_url || `https://app.${domain}/settings/security`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="${COMMON_STYLES.body}">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="${COMMON_STYLES.logo}">
      </div>

      <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #dc3545;">${subject}</h2>
        <p>Hi ${name},</p>
        <p>We detected a ${alert_type} on your Doughy AI account.</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3>Event Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong> ${time}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Location:</strong> ${location}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Device:</strong> ${device}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>IP Address:</strong> ${ip_address}</li>
        </ul>
      </div>

      <div style="margin-bottom: 25px;">
        <p>${message || "If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication if you haven't already."}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${finalActionUrl}" style="background-color: #0d6efd; color: white; ${COMMON_STYLES.button}">${action_text}</a>
      </div>

      <div style="${COMMON_STYLES.footer}">
        <p>This is an automated security alert from Doughy AI. Please do not reply to this email.</p>
        <p>If you need assistance, please contact our support team at <a href="mailto:support@${domain}" style="color: #0d6efd;">support@${domain}</a>.</p>
      </div>
    </body>
    </html>
  `;
}

// =============================================================================
// Welcome Email Template
// =============================================================================

export function generateWelcomeEmailHtml(
  data: WelcomeEmailData,
  domain: string
): string {
  const {
    name = 'there',
    verify_url,
    login_url,
    account_url,
  } = data;

  const finalVerifyUrl = verify_url || `https://app.${domain}/verify-email`;
  const finalLoginUrl = login_url || `https://app.${domain}/login`;
  const finalAccountUrl = account_url || `https://app.${domain}/settings`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Welcome to Doughy AI</title>
    </head>
    <body style="${COMMON_STYLES.body}">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="${COMMON_STYLES.logoLarge}">
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
        <a href="${finalVerifyUrl}" style="background-color: #28a745; color: white; ${COMMON_STYLES.button} display: inline-block; margin-bottom: 15px;">Verify Your Email</a>
        <p style="font-size: 14px; color: #6c757d;">This verification link will expire in 24 hours.</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
        <h3 style="margin-top: 0;">Need Help?</h3>
        <p>Our support team is always ready to assist you. Feel free to reach out if you have any questions.</p>
        <p><a href="mailto:support@${domain}" style="color: #0d6efd;">support@${domain}</a></p>
      </div>

      <div style="${COMMON_STYLES.footer} text-align: center;">
        <p>You're receiving this email because you recently created an account on Doughy AI.</p>
        <p>© ${new Date().getFullYear()} Doughy AI. All rights reserved.</p>
        <p>
          <a href="${finalLoginUrl}" style="color: #0d6efd; margin: 0 10px;">Login</a> |
          <a href="${finalAccountUrl}" style="color: #0d6efd; margin: 0 10px;">Account Settings</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

// =============================================================================
// Reminder Email Template
// =============================================================================

export function generateReminderEmailHtml(
  data: ReminderEmailData,
  domain: string,
  subject: string
): string {
  const {
    name = 'there',
    message_title = 'Action Required',
    message_body = 'This is a reminder to complete this action on your Doughy AI account.',
    action_url,
    action_text = 'Take Action',
    additional_content = '',
  } = data;

  const finalActionUrl = action_url || `https://app.${domain}/`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="${COMMON_STYLES.body}">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="${COMMON_STYLES.logo}">
      </div>

      <div style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #0d6efd;">Reminder: ${message_title}</h2>
        <p>Hi ${name},</p>
      </div>

      <div style="margin-bottom: 25px;">
        <p>${message_body}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${finalActionUrl}" style="background-color: #0d6efd; color: white; ${COMMON_STYLES.button}">${action_text}</a>
      </div>

      ${additional_content}

      <div style="${COMMON_STYLES.footer}">
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
}

// =============================================================================
// Test Email Template
// =============================================================================

export function generateTestEmailHtml(
  data: TestEmailData,
  domain: string
): string {
  const { name = 'Developer', template_data = {} } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://app.${domain}/images/doughy_logo.png" alt="Doughy AI Logo" style="${COMMON_STYLES.logo}">
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-top: 0;">Test Email</h1>
        <p>Hello ${name},</p>
        <p>This is a test email from Doughy AI's Resend integration.</p>
        <p>If you're seeing this, the email service is working correctly!</p>
      </div>

      <div style="background-color: #e9f7fe; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Template Data:</h3>
        <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 3px; overflow: auto;">${JSON.stringify(template_data, null, 2)}</pre>
      </div>

      <div style="${COMMON_STYLES.footer} text-align: center;">
        <p>This is a test email from the Resend email integration.</p>
        <p>© ${new Date().getFullYear()} Doughy AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

// =============================================================================
// Reminder Title Helper
// =============================================================================

export function getReminderTitle(reminderType: string): string {
  switch (reminderType) {
    case 'email_verification':
      return 'Verify Your Email';
    case 'onboarding':
      return 'Complete Your Onboarding';
    case 'profile':
      return 'Complete Your Profile';
    case 'subscription':
      return 'Subscription Expiring Soon';
    case 'document':
      return 'Document Update Needed';
    default:
      return 'Action Required';
  }
}
