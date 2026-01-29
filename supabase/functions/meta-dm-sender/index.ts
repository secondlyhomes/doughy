/**
 * Meta DM Sender Edge Function
 *
 * Facebook/Instagram DM integration.
 * Uses Meta Graph API to send messages, respects 24-hour window rules,
 * handles page access tokens.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface MetaDMRequest {
  contact_id: string;
  message: string;
  platform?: 'facebook' | 'instagram';  // Default: facebook
  message_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;  // Required if message_type is MESSAGE_TAG
}

interface MetaDMResult {
  success: boolean;
  message_id?: string;
  recipient_id?: string;
  error?: string;
  error_code?: string;
}

// Valid message tags for outside 24-hour window
const VALID_MESSAGE_TAGS = [
  'CONFIRMED_EVENT_UPDATE',
  'POST_PURCHASE_UPDATE',
  'ACCOUNT_UPDATE',
  'HUMAN_AGENT'  // For customer support
];

// =============================================================================
// Rate Limit Helpers
// =============================================================================

/**
 * Check rate limits without updating - returns current counts for later update
 */
function checkRateLimit(
  currentCreds: {
    hourly_dm_count: number;
    hourly_dm_reset_at: string | null;
    daily_dm_count: number;
    daily_dm_reset_at: string | null;
  }
): { allowed: boolean; error?: string; hourlyCount: number; dailyCount: number } {
  const now = new Date();
  let hourlyCount = currentCreds.hourly_dm_count || 0;
  let dailyCount = currentCreds.daily_dm_count || 0;

  // Check hourly reset
  if (currentCreds.hourly_dm_reset_at) {
    const hourlyReset = new Date(currentCreds.hourly_dm_reset_at);
    if (now >= hourlyReset) {
      hourlyCount = 0;
    }
  }

  // Check daily reset
  if (currentCreds.daily_dm_reset_at) {
    const dailyReset = new Date(currentCreds.daily_dm_reset_at);
    if (now >= dailyReset) {
      dailyCount = 0;
    }
  }

  // Check limits (Meta allows ~200/hour, ~1000/day for pages)
  if (hourlyCount >= 200) {
    return { allowed: false, error: 'Hourly DM limit reached (200/hour)', hourlyCount, dailyCount };
  }
  if (dailyCount >= 1000) {
    return { allowed: false, error: 'Daily DM limit reached (1000/day)', hourlyCount, dailyCount };
  }

  return { allowed: true, hourlyCount, dailyCount };
}

/**
 * Update rate limit counters AFTER successful send
 */
async function updateRateLimitCounters(
  supabase: ReturnType<typeof createClient>,
  credentialsId: string,
  currentCreds: {
    hourly_dm_reset_at: string | null;
    daily_dm_reset_at: string | null;
  },
  hourlyCount: number,
  dailyCount: number
): Promise<void> {
  const now = new Date();

  const hourlyResetAt = currentCreds.hourly_dm_reset_at && new Date(currentCreds.hourly_dm_reset_at) > now
    ? currentCreds.hourly_dm_reset_at
    : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  const dailyResetAt = currentCreds.daily_dm_reset_at && new Date(currentCreds.daily_dm_reset_at) > now
    ? currentCreds.daily_dm_reset_at
    : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from('meta_dm_credentials')
    .update({
      hourly_dm_count: hourlyCount + 1,
      hourly_dm_reset_at: hourlyResetAt,
      daily_dm_count: dailyCount + 1,
      daily_dm_reset_at: dailyResetAt,
      updated_at: now.toISOString()
    })
    .eq('id', credentialsId);

  if (updateError) {
    console.error('[MetaDM] Error updating rate limit counters:', updateError);
  }
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
    const body: MetaDMRequest = await req.json();
    const {
      contact_id,
      message,
      platform = 'facebook',
      message_type = 'UPDATE',
      tag
    } = body;

    if (!contact_id || !message) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'contact_id and message are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Validate message tag if provided
    if (message_type === 'MESSAGE_TAG' && (!tag || !VALID_MESSAGE_TAGS.includes(tag))) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: `Invalid message tag. Valid tags: ${VALID_MESSAGE_TAGS.join(', ')}`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get user's Meta credentials
    const { data: credentials, error: credError } = await supabase
      .from('meta_dm_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Meta DM not configured. Please connect your Facebook Page in settings.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check for Instagram and if it's available
    if (platform === 'instagram' && !credentials.instagram_account_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Instagram account not connected. Please link your Instagram Business account.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get contact with Meta ID
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, metadata')
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

    // Get Meta recipient ID from contact metadata
    const metadata = contact.metadata as Record<string, unknown> | null;
    const recipientId = platform === 'instagram'
      ? metadata?.instagram_id as string
      : metadata?.facebook_psid as string;

    if (!recipientId) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: `Contact does not have a ${platform} ID. They must message your page first.`
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Check rate limits (without updating - update after successful send)
    const rateLimitCheck = checkRateLimit({
      hourly_dm_count: credentials.hourly_dm_count,
      hourly_dm_reset_at: credentials.hourly_dm_reset_at,
      daily_dm_count: credentials.daily_dm_count,
      daily_dm_reset_at: credentials.daily_dm_reset_at
    });

    if (!rateLimitCheck.allowed) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: rateLimitCheck.error }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Build API request
    let endpoint: string;
    let messagePayload: Record<string, unknown>;

    if (platform === 'instagram') {
      // Instagram Graph API
      endpoint = `https://graph.facebook.com/v18.0/${credentials.instagram_account_id}/messages`;
      messagePayload = {
        recipient: { id: recipientId },
        message: { text: message }
      };
    } else {
      // Facebook Messenger API
      endpoint = `https://graph.facebook.com/v18.0/${credentials.page_id}/messages`;
      messagePayload = {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: message_type
      };

      // Add tag if using MESSAGE_TAG
      if (message_type === 'MESSAGE_TAG' && tag) {
        messagePayload.tag = tag;
      }
    }

    // Send message - include access_token in body instead of URL for security
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messagePayload,
        access_token: credentials.page_access_token,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[MetaDM] API error:', responseData);

      // Update credentials with error - check for failures
      const { error: credUpdateError } = await supabase
        .from('meta_dm_credentials')
        .update({
          last_error: responseData.error?.message || 'Unknown error',
          last_error_at: new Date().toISOString()
        })
        .eq('id', credentials.id);

      if (credUpdateError) {
        console.error('[MetaDM] Failed to save error details to credentials:', credUpdateError);
      }

      // Handle specific error codes
      const errorCode = responseData.error?.code;
      let userError = responseData.error?.message || 'Failed to send message';

      if (errorCode === 10) {
        userError = 'Permissions error. Please reconnect your Facebook Page.';
      } else if (errorCode === 551) {
        userError = 'This user has not initiated a conversation. They must message your page first.';
      } else if (errorCode === 230) {
        userError = 'Outside 24-hour messaging window. Use MESSAGE_TAG type for follow-ups.';
      } else if (errorCode === 190) {
        userError = 'Access token expired. Please reconnect your Facebook Page.';
        // Mark credentials as inactive
        const { error: deactivateError } = await supabase
          .from('meta_dm_credentials')
          .update({ is_active: false })
          .eq('id', credentials.id);
        if (deactivateError) {
          console.error('[MetaDM] Failed to deactivate credentials:', deactivateError);
        }
      }

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: userError,
            error_code: errorCode?.toString()
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Update rate limit counters AFTER successful send (prevents race condition)
    await updateRateLimitCounters(
      supabase,
      credentials.id,
      {
        hourly_dm_reset_at: credentials.hourly_dm_reset_at,
        daily_dm_reset_at: credentials.daily_dm_reset_at
      },
      rateLimitCheck.hourlyCount,
      rateLimitCheck.dailyCount
    );

    const result: MetaDMResult = {
      success: true,
      message_id: responseData.message_id,
      recipient_id: responseData.recipient_id
    };

    console.log(`[MetaDM] Success: ${result.message_id} to ${platform} user ${recipientId}`);

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[MetaDM] Error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
