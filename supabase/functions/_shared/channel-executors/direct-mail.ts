/**
 * Direct Mail Channel Executor
 *
 * Sends physical mail via PostGrid.
 *
 * @module _shared/channel-executors/direct-mail
 */

import type { SupabaseClient, ChannelResult, ContactInfo, MAIL_PRICING } from "./types.ts";
import { MAIL_PRICING as mailPricing } from "./types.ts";

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

/**
 * Send Direct Mail via PostGrid
 *
 * @param supabase - Supabase client
 * @param userId - User ID for credentials and credits
 * @param contact - Contact info with address
 * @param mailPieceType - Type of mail piece
 * @param templateId - PostGrid template ID (optional)
 * @param messageBody - Message content (optional)
 * @param touchLogId - Touch log ID for credit tracking
 * @returns Channel result with success/error and tracking number
 */
export async function sendDirectMail(
  supabase: SupabaseClient,
  userId: string,
  contact: ContactInfo,
  mailPieceType: string,
  templateId: string | undefined,
  messageBody: string | undefined,
  touchLogId: string
): Promise<ChannelResult> {
  const postgridApiKey = Deno.env.get('POSTGRID_API_KEY');

  if (!postgridApiKey) {
    return { success: false, error: 'PostGrid API key not configured' };
  }

  // Get mail piece cost
  const cost = mailPricing[mailPieceType] || 1.49;

  // Check and deduct credits
  const { data: deducted, error: deductError } = await supabase
    .rpc('deduct_mail_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_touch_log_id: touchLogId,
      p_mail_piece_type: mailPieceType,
      p_pieces_count: 1,
      p_description: `Direct mail to ${contact.first_name} ${contact.last_name}`,
    });

  if (deductError || !deducted) {
    return { success: false, error: 'Insufficient mail credits' };
  }

  // Get user's return address
  const { data: postgridCreds } = await supabase
    .schema('integrations').from('postgrid_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!postgridCreds || !contact.address) {
    // Refund credits if no address
    const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
      p_user_id: userId,
      p_amount: cost,
      p_reason: 'Address not configured',
    });
    if (refundError) {
      console.error('[DirectMail] CRITICAL: Failed to refund credits for missing address:', refundError);
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
        country: 'US',
      },
      from: {
        firstName: postgridCreds.return_name,
        companyName: postgridCreds.return_company,
        addressLine1: postgridCreds.return_address_line1,
        addressLine2: postgridCreds.return_address_line2 || '',
        city: postgridCreds.return_city,
        provinceOrState: postgridCreds.return_state,
        postalOrZip: postgridCreds.return_zip,
        country: 'US',
      },
      mailClass: (postgridCreds.default_mail_class as string) || 'first_class',
    };

    // Add template or content
    if (templateId) {
      payload.template = templateId;
    } else if (messageBody) {
      const sanitizedMessage = sanitizeHtml(messageBody);
      if (isLetter) {
        payload.html = `<html><body style="font-family: Arial, sans-serif; padding: 1in;"><p>${sanitizedMessage.replace(/\n/g, '<br>')}</p></body></html>`;
      } else {
        payload.frontHtml = `<div style="padding: 20px;"><p>${sanitizedMessage.replace(/\n/g, '<br>')}</p></div>`;
      }
    }

    // Set postcard size
    if (!isLetter) {
      const sizeMap: Record<string, string> = {
        'postcard_4x6': '4x6',
        'postcard_6x9': '6x9',
        'postcard_6x11': '6x11',
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
        p_reason: `PostGrid error: ${response.status}`,
      });
      if (refundError) {
        console.error('[DirectMail] CRITICAL: Failed to refund credits after PostGrid error:', refundError);
        return { success: false, error: `PostGrid error: ${response.status}. Credit refund failed - contact support.` };
      }
      return { success: false, error: `PostGrid error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.data?.id,
      trackingNumber: result.data?.trackingNumber,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Direct mail send failed';
    // Refund credits on error
    const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
      p_user_id: userId,
      p_amount: cost,
      p_reason: `Error: ${errorMessage}`,
    });
    if (refundError) {
      console.error('[DirectMail] CRITICAL: Failed to refund credits after error:', refundError);
      return { success: false, error: `${errorMessage}. Credit refund failed - contact support.` };
    }
    return { success: false, error: errorMessage };
  }
}
