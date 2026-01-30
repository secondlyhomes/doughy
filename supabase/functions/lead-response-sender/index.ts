/**
 * Lead Response Sender Edge Function
 *
 * Sends approved lead responses via email after landlord approval.
 * Called by the approval flow in the MoltBot inbox.
 *
 * Features:
 * - Security scanning of AI-generated responses
 * - Platform-specific reply method handling
 * - Idempotency (prevents duplicate sends)
 * - Status tracking (pending → sending → sent/failed)
 * - Warnings array for non-critical issues
 *
 * @see /docs/moltbot-ecosystem-expansion.md
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@1.1.0";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";
import { filterOutput } from "../_shared/security.ts";
import { decryptServer } from "../_shared/crypto-server.ts";

// =============================================================================
// Constants
// =============================================================================

const LOG_PREFIX = '[LeadResponseSender]';

// Platform reply methods (from platform-email-parser)
type ReplyMethod =
  | 'email_reply'      // Can reply via email thread (e.g., Airbnb)
  | 'direct_email'     // Contact info provided - email them directly
  | 'platform_only'    // Must use platform website/app
  | 'messenger'        // Facebook Messenger only
  | 'sms'              // SMS/text message
  | 'unknown';

// Platforms that support email replies
const EMAIL_CAPABLE_METHODS: ReplyMethod[] = ['email_reply', 'direct_email'];

// =============================================================================
// Types
// =============================================================================

interface LeadResponseRequest {
  messageId: string;        // landlord_messages.id
  conversationId: string;   // landlord_conversations.id
  responseText: string;     // Approved (possibly edited) response
  workspaceId?: string;     // For workspace context (optional, can be derived)
}

interface LeadResponseResult {
  success: boolean;
  messageId?: string;
  externalMessageId?: string;
  deliveredAt?: string;
  error?: string;
  requiresManualAction?: boolean;
  warnings?: string[];
}

interface ContactData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface PropertyData {
  id: string;
  name: string | null;
  address_line1: string | null;
}

interface ConversationData {
  id: string;
  platform: string | null;
  property_id: string | null;
  external_message_id: string | null;
  workspace_id: string;
  channel: string;
  crm_contacts: ContactData | null;
  landlord_properties: PropertyData | null;
}

interface MessageData {
  id: string;
  conversation_id: string;
  sender: string;
  content: string;
  send_status: string | null;
  created_at: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get Resend API key from database (same pattern as resend-email)
 */
async function getResendApiKey(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data, error } = await supabase
    .from('security_api_keys')
    .select('key_ciphertext')
    .or('service.eq.resend,service.eq.resend-key')
    .single();

  if (error || !data?.key_ciphertext) {
    console.error(`${LOG_PREFIX} Error fetching Resend API key:`, error);
    throw new Error('Resend API key not configured');
  }

  try {
    const decryptedKey = await decryptServer(data.key_ciphertext);
    return decryptedKey;
  } catch (decryptError) {
    console.error(`${LOG_PREFIX} Error decrypting Resend API key:`, decryptError);
    throw new Error('Failed to decrypt Resend API key');
  }
}

/**
 * Get Resend email domain from system settings
 */
async function getResendEmailDomain(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'resend_email_domain')
      .single();

    if (error) throw error;

    if (data?.value) {
      let domainValue = data.value;
      if (typeof domainValue === 'string') {
        try {
          const parsedValue = JSON.parse(domainValue);
          if (typeof parsedValue === 'string') {
            return parsedValue;
          }
        } catch {
          return domainValue;
        }
      } else if (typeof domainValue === 'object') {
        return String(domainValue);
      }
      return domainValue;
    }

    return 'doughy.app';
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching email domain:`, error);
    return 'doughy.app';
  }
}

/**
 * Get workspace owner's info for from/reply-to
 */
async function getWorkspaceOwnerInfo(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string
): Promise<{ name: string; email: string } | null> {
  try {
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('owner_id, name')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      console.warn(`${LOG_PREFIX} Could not fetch workspace:`, wsError);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, full_name, business_name')
      .eq('user_id', workspace.owner_id)
      .single();

    if (profileError || !profile) {
      console.warn(`${LOG_PREFIX} Could not fetch owner profile:`, profileError);
      return null;
    }

    return {
      name: profile.business_name || profile.full_name || workspace.name || 'MoltBot',
      email: profile.email || '',
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting workspace owner:`, error);
    return null;
  }
}

/**
 * Handle platform-specific reply methods that don't support email
 */
function handleNonEmailPlatform(
  replyMethod: ReplyMethod,
  platform: string
): LeadResponseResult {
  const platformMessages: Record<string, string> = {
    platform_only: `This ${platform} inquiry requires in-app messaging. Please reply directly on ${platform}.`,
    messenger: 'Facebook Messenger replies are not yet supported. Please reply via Facebook Messenger.',
    sms: 'SMS replies are not yet supported. Please text the contact directly.',
    unknown: 'Unable to determine how to reply to this inquiry. Please contact the lead manually.',
  };

  return {
    success: false,
    error: platformMessages[replyMethod] || platformMessages.unknown,
    requiresManualAction: true,
    warnings: [`Reply method "${replyMethod}" requires manual action on ${platform}`],
  };
}

/**
 * Build email HTML for lead response
 */
function buildEmailHtml(
  responseText: string,
  contactName: string,
  propertyName?: string,
  senderName?: string
): string {
  const escapedResponse = responseText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const signature = senderName ? `<p>Best regards,<br>${senderName}</p>` : '';
  const propertyNote = propertyName
    ? `<p style="color: #666; font-size: 14px;">Regarding: ${propertyName}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 20px;">
    ${propertyNote}
    <p>Hi ${contactName},</p>
    <div style="margin: 20px 0;">
      ${escapedResponse}
    </div>
    ${signature}
  </div>
  <div style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
    <p>This message was sent via MoltBot.</p>
  </div>
</body>
</html>
  `.trim();
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const warnings: string[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // SECURITY: Verify user authentication before sending any responses
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`${LOG_PREFIX} Authentication required but no Authorization header`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error(`${LOG_PREFIX} Invalid authentication:`, authError?.message);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    console.log(`${LOG_PREFIX} Authenticated user: ${user.id}`);

    // Parse request
    const body: LeadResponseRequest = await req.json();
    const { messageId, conversationId, responseText } = body;

    console.log(`${LOG_PREFIX} Processing response for message ${messageId}`);

    // Validate required fields
    if (!messageId || !conversationId || !responseText) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: messageId, conversationId, responseText',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // =======================================================================
    // STEP 1: Idempotency check - prevent duplicate sends
    // =======================================================================
    const { data: existingMessage, error: msgError } = await supabase
      .from('landlord_messages')
      .select('id, send_status, conversation_id')
      .eq('id', messageId)
      .single();

    if (msgError || !existingMessage) {
      console.error(`${LOG_PREFIX} Message not found:`, msgError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Message not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check if already sent (idempotency)
    if (existingMessage.send_status === 'sent') {
      console.log(`${LOG_PREFIX} Message ${messageId} already sent, returning success`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            messageId,
            message: 'Already sent',
            warnings: ['Message was already sent previously'],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check if currently being sent (prevent race condition)
    if (existingMessage.send_status === 'sending') {
      console.log(`${LOG_PREFIX} Message ${messageId} is currently being sent`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Message is currently being sent',
            warnings: ['Please wait and try again if needed'],
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // =======================================================================
    // STEP 2: Fetch conversation and contact data
    // =======================================================================
    const { data: conversation, error: convError } = await supabase
      .from('landlord_conversations')
      .select(`
        id,
        platform,
        property_id,
        external_message_id,
        workspace_id,
        channel,
        crm_contacts!landlord_conversations_contact_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        landlord_properties!landlord_conversations_property_id_fkey (
          id,
          name,
          address_line1
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error(`${LOG_PREFIX} Conversation not found:`, convError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Conversation not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const convData = conversation as unknown as ConversationData;
    const platform = convData.platform || 'direct_email';

    // Determine reply method based on platform (following platform-email-parser pattern)
    const REPLY_METHOD_BY_PLATFORM: Record<string, ReplyMethod> = {
      airbnb: 'email_reply',
      furnishedfinder: 'platform_only',
      turbotenant: 'direct_email',
      facebook_marketplace: 'messenger',
      zillow: 'direct_email',
      hotpads: 'direct_email',
      craigslist: 'email_reply',
      apartments_com: 'direct_email',
      direct_email: 'direct_email',
    };

    // For FurnishedFinder, if we have contact email, use direct_email
    let replyMethod: ReplyMethod = REPLY_METHOD_BY_PLATFORM[platform] || 'direct_email';
    if (platform === 'furnishedfinder' && convData.crm_contacts?.email) {
      replyMethod = 'direct_email';
    }

    console.log(`${LOG_PREFIX} Platform: ${platform}, Reply method: ${replyMethod}`);

    // =======================================================================
    // STEP 3: Check if platform supports email
    // =======================================================================
    if (!EMAIL_CAPABLE_METHODS.includes(replyMethod)) {
      console.log(`${LOG_PREFIX} Platform ${platform} requires manual action`);
      const result = handleNonEmailPlatform(replyMethod, platform);
      return addCorsHeaders(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
        req
      );
    }

    // Extract contact info
    const contact = convData.crm_contacts;
    const contactEmail = contact?.email;
    const contactName = contact
      ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'there'
      : 'there';

    // Validate contact email
    if (!contactEmail) {
      console.error(`${LOG_PREFIX} No contact email for conversation ${conversationId}`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'No email address for this contact. Please reply manually.',
            requiresManualAction: true,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // =======================================================================
    // STEP 4: Security scan the AI response
    // =======================================================================
    const filterResult = filterOutput(responseText);
    let safeResponse = filterResult.filtered;

    if (!filterResult.safe) {
      console.warn(`${LOG_PREFIX} Response was filtered for security`);
      warnings.push('Response was filtered for security reasons');
    }

    if (filterResult.containsSuspiciousContent) {
      warnings.push('Response may contain suspicious content - please review');
    }

    // =======================================================================
    // STEP 5: Update status to 'sending'
    // =======================================================================
    const { error: statusUpdateError } = await supabase
      .from('landlord_messages')
      .update({ send_status: 'sending' })
      .eq('id', messageId);

    if (statusUpdateError) {
      console.error(`${LOG_PREFIX} Failed to update send status:`, statusUpdateError);
      warnings.push('Failed to update status - continuing anyway');
    }

    // =======================================================================
    // STEP 6: Get email configuration
    // =======================================================================
    let resendApiKey: string;
    try {
      resendApiKey = await getResendApiKey(supabase);
    } catch (error) {
      // Revert status on failure
      await supabase
        .from('landlord_messages')
        .update({ send_status: 'failed', send_error: 'Resend API key not configured' })
        .eq('id', messageId);

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Email service not configured. Please contact support.',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const domain = await getResendEmailDomain(supabase);
    const workspaceId = convData.workspace_id;
    if (!workspaceId) {
      warnings.push('No workspace ID found - using default sender info');
    }
    const ownerInfo = workspaceId
      ? await getWorkspaceOwnerInfo(supabase, workspaceId)
      : null;

    // Build from/reply-to
    const fromName = ownerInfo?.name || 'MoltBot';
    const fromEmail = `moltbot@${domain}`;
    const replyTo = ownerInfo?.email || `support@${domain}`;

    // =======================================================================
    // STEP 7: Build and send the email
    // =======================================================================
    const resend = new Resend(resendApiKey);

    const propertyName = convData.landlord_properties?.name ||
      convData.landlord_properties?.address_line1 ||
      undefined;

    const emailSubject = propertyName
      ? `Re: Your inquiry about ${propertyName}`
      : 'Re: Your rental inquiry';

    const emailHtml = buildEmailHtml(
      safeResponse,
      contactName,
      propertyName,
      ownerInfo?.name
    );

    console.log(`${LOG_PREFIX} Sending email to ${contactEmail}`);

    try {
      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [contactEmail],
        subject: emailSubject,
        html: emailHtml,
        text: safeResponse,
        reply_to: replyTo,
        tags: [
          { name: 'type', value: 'lead_response' },
          { name: 'platform', value: platform },
          { name: 'conversation_id', value: conversationId },
        ],
      });

      if (emailError) {
        throw emailError;
      }

      // =======================================================================
      // STEP 8: Update status to 'sent'
      // =======================================================================
      const deliveredAt = new Date().toISOString();

      const { error: successUpdateError } = await supabase
        .from('landlord_messages')
        .update({
          send_status: 'sent',
          send_error: null,
          external_message_id: emailResult?.id || null,
        })
        .eq('id', messageId);

      if (successUpdateError) {
        console.error(`${LOG_PREFIX} Failed to update success status:`, successUpdateError);
        warnings.push('Email sent but status update failed');
      }

      console.log(`${LOG_PREFIX} Successfully sent email to ${contactEmail}, ID: ${emailResult?.id}`);

      const result: LeadResponseResult = {
        success: true,
        messageId,
        externalMessageId: emailResult?.id,
        deliveredAt,
      };

      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      return addCorsHeaders(
        new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
        req
      );
    } catch (sendError) {
      // =======================================================================
      // STEP 9: Handle send failure
      // =======================================================================
      const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
      console.error(`${LOG_PREFIX} Failed to send email:`, errorMessage);

      const { error: failureUpdateError } = await supabase
        .from('landlord_messages')
        .update({
          send_status: 'failed',
          send_error: errorMessage,
        })
        .eq('id', messageId);

      if (failureUpdateError) {
        console.error(`${LOG_PREFIX} Failed to update failure status:`, failureUpdateError);
      }

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: `Failed to send email: ${errorMessage}`,
            warnings,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${LOG_PREFIX} Unexpected error:`, error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          warnings,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
