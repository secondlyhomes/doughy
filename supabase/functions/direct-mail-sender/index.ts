/**
 * Direct Mail Sender Edge Function
 *
 * PostGrid integration for direct mail.
 * Handles mail credit deduction, PostGrid API calls for postcards/letters,
 * and delivery tracking.
 *
 * This is the standalone direct mail API - also used by drip-touch-executor.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface DirectMailRequest {
  contact_id: string;
  mail_piece_type: 'postcard_4x6' | 'postcard_6x9' | 'postcard_6x11' | 'yellow_letter' | 'letter_1_page' | 'letter_2_page';
  template_id?: string;            // PostGrid template ID
  message?: string;                // Custom message (if no template)
  front_html?: string;             // Custom front HTML (postcards)
  back_html?: string;              // Custom back HTML (postcards)
  merge_variables?: Record<string, string>;
  mail_class?: 'first_class' | 'standard';
  send_date?: string;              // Future send date (ISO string)
}

interface DirectMailResult {
  success: boolean;
  mail_id?: string;
  tracking_number?: string;
  expected_delivery_date?: string;
  credits_used?: number;
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

// PostGrid size mapping
const POSTCARD_SIZES: Record<string, string> = {
  'postcard_4x6': '4x6',
  'postcard_6x9': '6x9',
  'postcard_6x11': '6x11',
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

/**
 * Validate custom HTML for dangerous patterns
 * Allows formatting HTML but rejects script injection attempts
 */
function validateCustomHtml(html: string): { valid: boolean; error?: string } {
  const dangerousPatterns = [
    /<script\b/i,
    /<\/script>/i,
    /\bon\w+\s*=/i,  // onclick, onerror, etc.
    /javascript:/i,
    /<iframe\b/i,
    /<frame\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<link\b[^>]*\brel\s*=\s*["']?import/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(html)) {
      return { valid: false, error: 'Custom HTML contains potentially dangerous content (scripts, event handlers, or embeds are not allowed)' };
    }
  }

  return { valid: true };
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
    const postgridApiKey = Deno.env.get('POSTGRID_API_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!postgridApiKey) {
      throw new Error('PostGrid API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const userId = user.id;

    // Parse request
    const body: DirectMailRequest = await req.json();
    const {
      contact_id,
      mail_piece_type,
      template_id,
      message,
      front_html,
      back_html,
      merge_variables,
      mail_class = 'first_class',
      send_date
    } = body;

    if (!contact_id || !mail_piece_type) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'contact_id and mail_piece_type are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get contact with address
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, address')
      .eq('id', contact_id)
      .eq('user_id', userId)
      .single();

    if (contactError || !contact) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Contact not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const address = contact.address as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: string;
    } | null;

    if (!address?.line1 || !address?.city || !address?.state || !address?.zip) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Contact does not have a complete address' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get user's PostGrid settings
    const { data: postgridCreds } = await supabase
      .from('postgrid_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!postgridCreds?.return_address_line1) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Return address not configured. Please set up PostGrid in settings.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Calculate cost
    const cost = MAIL_PRICING[mail_piece_type] || 1.49;

    // Check and reserve credits BEFORE sending mail (prevents race condition)
    const { data: deducted, error: deductError } = await supabase.rpc('deduct_mail_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_touch_log_id: null,
      p_mail_piece_type: mail_piece_type,
      p_pieces_count: 1,
      p_description: `${mail_piece_type} to ${contact.first_name} ${contact.last_name} (pending)`
    });

    if (deductError || !deducted) {
      // Get actual balance for error message
      const { data: credits } = await supabase
        .from('user_mail_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Insufficient mail credits',
            credits_needed: cost,
            credits_available: credits?.balance || 0
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Determine if letter or postcard
    const isLetter = mail_piece_type.includes('letter');

    // Build PostGrid payload
    const payload: Record<string, unknown> = {
      to: {
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        addressLine1: address.line1,
        addressLine2: address.line2 || '',
        city: address.city,
        provinceOrState: address.state,
        postalOrZip: address.zip,
        country: 'US'
      },
      from: {
        firstName: postgridCreds.return_name || '',
        companyName: postgridCreds.return_company || '',
        addressLine1: postgridCreds.return_address_line1,
        addressLine2: postgridCreds.return_address_line2 || '',
        city: postgridCreds.return_city,
        provinceOrState: postgridCreds.return_state,
        postalOrZip: postgridCreds.return_zip,
        country: 'US'
      },
      mailClass: mail_class
    };

    // Add send date if specified
    if (send_date) {
      payload.sendDate = send_date;
    }

    // Add merge variables
    if (merge_variables) {
      payload.mergeVariables = merge_variables;
    }

    // Handle content
    if (template_id) {
      payload.template = template_id;
    } else if (isLetter) {
      // Letter content - sanitize user input
      const letterContent = sanitizeHtml(message || 'This is your personalized letter.');
      const sanitizedFirstName = sanitizeHtml(contact.first_name || 'Friend');
      const sanitizedReturnName = sanitizeHtml(postgridCreds.return_name || 'The Team');

      payload.html = `
        <html>
          <head>
            <style>
              body { font-family: Georgia, serif; margin: 1in; line-height: 1.6; }
              .date { margin-bottom: 1em; }
              .greeting { margin-bottom: 1em; }
              .signature { margin-top: 2em; }
            </style>
          </head>
          <body>
            <div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="greeting">Dear ${sanitizedFirstName},</div>
            <div class="body">${letterContent.replace(/\n/g, '<br>')}</div>
            <div class="signature">
              Sincerely,<br>
              ${sanitizedReturnName}
            </div>
          </body>
        </html>
      `;

      // Yellow letter style
      if (mail_piece_type === 'yellow_letter') {
        payload.html = `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Comic Sans MS', 'Bradley Hand', cursive;
                  background-color: #FFFACD;
                  margin: 0.75in;
                  line-height: 1.8;
                  color: #333;
                }
                .content { font-size: 14pt; }
              </style>
            </head>
            <body>
              <div class="content">
                ${letterContent.replace(/\n/g, '<br>')}
              </div>
            </body>
          </html>
        `;
      }
    } else {
      // Postcard content - sanitize user input
      payload.size = POSTCARD_SIZES[mail_piece_type] || '4x6';

      if (front_html) {
        // Validate custom HTML for dangerous patterns
        const frontValidation = validateCustomHtml(front_html);
        if (!frontValidation.valid) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: `front_html: ${frontValidation.error}` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        payload.frontHtml = front_html;
      } else {
        const sanitizedMessage = sanitizeHtml(message || 'We would love to connect with you!');
        payload.frontHtml = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #2563eb; margin-bottom: 10px;">Important Notice</h2>
            <p>${sanitizedMessage}</p>
          </div>
        `;
      }

      if (back_html) {
        // Validate custom HTML for dangerous patterns
        const backValidation = validateCustomHtml(back_html);
        if (!backValidation.valid) {
          return addCorsHeaders(
            new Response(
              JSON.stringify({ success: false, error: `back_html: ${backValidation.error}` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            ),
            req
          );
        }
        payload.backHtml = back_html;
      } else {
        const sanitizedCompany = sanitizeHtml(postgridCreds.return_company || postgridCreds.return_name || '');
        const sanitizedAddress = sanitizeHtml(postgridCreds.return_address_line1 || '');
        const sanitizedCity = sanitizeHtml(postgridCreds.return_city || '');
        const sanitizedState = sanitizeHtml(postgridCreds.return_state || '');
        const sanitizedZip = sanitizeHtml(postgridCreds.return_zip || '');
        payload.backHtml = `
          <div style="padding: 20px; font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong>${sanitizedCompany}</strong><br>
              ${sanitizedAddress}<br>
              ${sanitizedCity}, ${sanitizedState} ${sanitizedZip}
            </div>
          </div>
        `;
      }
    }

    // Determine endpoint
    const endpoint = isLetter
      ? 'https://api.postgrid.com/print-mail/v1/letters'
      : 'https://api.postgrid.com/print-mail/v1/postcards';

    // Send to PostGrid
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
      console.error('[DirectMail] PostGrid error:', response.status, errorText);

      // Refund credits since mail failed
      const { error: refundError } = await supabase.rpc('add_mail_credits_refund', {
        p_user_id: userId,
        p_amount: cost,
        p_reason: `PostGrid error: ${response.status}`
      });

      if (refundError) {
        console.error('[DirectMail] CRITICAL: Failed to refund credits after PostGrid error:', refundError);
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              error: `PostGrid error: ${response.status}`,
              details: errorText,
              credit_refund_failed: true,
              credits_owed: cost,
              message: 'Your credits could not be automatically refunded. Please contact support.'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: `PostGrid error: ${response.status}`,
            details: errorText,
            credits_refunded: true
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const postgridResult = await response.json();

    // Credits already deducted above - update PostGrid credentials with last send time
    const { error: updateError } = await supabase
      .from('postgrid_credentials')
      .update({ last_mail_sent_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[DirectMail] Error updating PostGrid credentials:', updateError);
      // Non-critical, continue
    }

    const result: DirectMailResult = {
      success: true,
      mail_id: postgridResult.data?.id,
      tracking_number: postgridResult.data?.trackingNumber,
      expected_delivery_date: postgridResult.data?.expectedDeliveryDate,
      credits_used: cost
    };

    console.log(`[DirectMail] Success: ${result.mail_id} for contact ${contact_id}`);

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[DirectMail] Error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
