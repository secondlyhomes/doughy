/**
 * Platform Email Parser Edge Function
 *
 * Parses incoming emails from rental platforms (FurnishedFinder, Airbnb, TurboTenant,
 * Facebook Marketplace, Zillow, etc.) and extracts structured data for MoltBot.
 *
 * This function is called by MoltBot when it receives a new email notification.
 * It returns structured data that MoltBot can use to:
 * - Create/update contacts
 * - Score leads
 * - Generate appropriate responses
 * - Know how to reply (platform-only vs direct email)
 *
 * @module platform-email-parser
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleCors, addCorsHeaders } from "../_shared/cors.ts";
import {
  type ParseEmailRequest,
  type ParsedEmailResult,
  detectPlatform,
  determineReplyMethod,
  detectInquiryType,
  extractContact,
  extractAdditionalDetails,
  extractDates,
  extractPropertyHint,
  calculateParsingConfidence,
  cleanMessageContent,
  sanitizeInput,
  INPUT_LIMITS,
} from "../_shared/parsers/index.ts";

// =============================================================================
// Main Parsing Function
// =============================================================================

function parseEmail(request: ParseEmailRequest): ParsedEmailResult {
  const { from, subject, body_text, body_html } = request;

  // Use HTML body if available, otherwise text
  let body = body_text || (body_html?.replace(/<[^>]+>/g, ' ') || '');

  // Input validation to prevent ReDoS attacks
  body = sanitizeInput(body, INPUT_LIMITS.MAX_BODY_LENGTH);
  const safeSubject = sanitizeInput(subject, INPUT_LIMITS.MAX_SUBJECT_LENGTH);

  // Detect platform
  const platform = detectPlatform(from, safeSubject, body);

  // Extract all data
  const contact = extractContact(from, safeSubject, body);
  const dates = extractDates(body);
  const propertyHint = extractPropertyHint(safeSubject, body);
  const additionalDetails = extractAdditionalDetails(body);

  // Determine reply method
  const replyMethod = determineReplyMethod(platform, !!contact.email, !!contact.phone);

  // Detect inquiry type
  const inquiryType = detectInquiryType(safeSubject, body);

  // Build result
  const result: ParsedEmailResult = {
    platform,
    reply_method: replyMethod,
    inquiry_type: inquiryType,
    contact,
    dates,
    property_hint: propertyHint,
    message_content: cleanMessageContent(body),
    original_subject: safeSubject,
    guests: additionalDetails.guests,
    pets: additionalDetails.pets,
    budget: additionalDetails.budget,
    special_requests: additionalDetails.special_requests,
    confidence: 0,
    raw_metadata: {
      from,
      received_at: request.received_at,
      headers: request.headers,
    },
  };

  // Calculate confidence
  result.confidence = calculateParsingConfidence(result);

  return result;
}

// =============================================================================
// HTTP Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Check if this is a service role key (server-to-server authentication)
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    const moltbotSecretKey = Deno.env.get('MOLTBOT_SECRET_KEY');
    const isServiceRole = (secretKey && token === secretKey) || (moltbotSecretKey && token === moltbotSecretKey);

    if (isServiceRole) {
      // Service role authentication - trusted server-to-server call
      console.log('[platform-email-parser] Service role authentication');
    } else {
      // User JWT authentication
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabasePublishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabasePublishableKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Verify the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({ success: false, error: 'Invalid or expired token' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }
    }

    // Parse request body
    const body: ParseEmailRequest = await req.json();

    // Validate required fields
    if (!body.from || !body.subject) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: from, subject' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Parse the email
    const result = parseEmail(body);

    // Return parsed result
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: true, data: result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  } catch (error) {
    console.error('Error parsing email:', error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
