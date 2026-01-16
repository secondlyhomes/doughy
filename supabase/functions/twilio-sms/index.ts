/**
 * Twilio SMS Edge Function
 * Description: Sends SMS messages via Twilio API
 * Phase: Sprint 3 - AI & Automation
 * Zone: D (Integrations)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-standardized.ts';
import { decryptServer } from '../_shared/crypto-server.ts';

interface SMSRequest {
  to: string;
  body: string;
  mediaUrls?: string[];
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Get Twilio credentials from encrypted storage
 */
async function getTwilioCredentials(
  supabase: ReturnType<typeof createClient>
): Promise<TwilioCredentials | null> {
  try {
    // Fetch all Twilio-related keys
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('service, key_ciphertext')
      .or('service.ilike.%twilio%');

    if (error || !data || data.length === 0) {
      console.error('[Twilio-SMS] No Twilio credentials found:', error?.message);
      return null;
    }

    const credentials: Partial<TwilioCredentials> = {};

    for (const row of data) {
      const decrypted = await decryptServer(row.key_ciphertext);
      const service = row.service.toLowerCase();

      if (service.includes('sid') || service.includes('account')) {
        credentials.accountSid = decrypted;
      } else if (service.includes('token') || service.includes('auth')) {
        credentials.authToken = decrypted;
      } else if (service.includes('phone') || service.includes('number')) {
        credentials.phoneNumber = decrypted;
      }
    }

    // Validate all credentials are present
    if (!credentials.accountSid || !credentials.authToken || !credentials.phoneNumber) {
      console.error('[Twilio-SMS] Missing required Twilio credentials');
      return null;
    }

    return credentials as TwilioCredentials;
  } catch (error) {
    console.error('[Twilio-SMS] Error getting Twilio credentials:', error);
    return null;
  }
}

/**
 * Validate E.164 phone number format
 */
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Send SMS via Twilio API
 */
async function sendTwilioSMS(
  credentials: TwilioCredentials,
  request: SMSRequest
): Promise<{ sid: string; status: string }> {
  const { accountSid, authToken, phoneNumber } = credentials;
  const { to, body, mediaUrls } = request;

  const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Build form data
  const formData = new URLSearchParams();
  formData.append('From', phoneNumber);
  formData.append('To', to);
  formData.append('Body', body);

  // Add media URLs for MMS if provided
  if (mediaUrls && mediaUrls.length > 0) {
    mediaUrls.forEach((url) => {
      formData.append('MediaUrl', url);
    });
  }

  // Create Basic Auth header
  const authHeader = btoa(`${accountSid}:${authToken}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authHeader}`,
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || errorData.error_message || `Twilio API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    sid: data.sid,
    status: data.status,
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json() as SMSRequest;

    // Validate required fields
    if (!body.to || !body.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate phone number format
    if (!isValidE164(body.to)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid phone number format. Use E.164 format (e.g., +15551234567)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate message length (Twilio limit is 1600 characters for SMS)
    if (body.body.length > 1600) {
      return new Response(
        JSON.stringify({
          error: 'Message too long. Maximum 1600 characters.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get Twilio credentials
    const credentials = await getTwilioCredentials(supabase);
    if (!credentials) {
      return new Response(
        JSON.stringify({ error: 'Twilio not configured. Please add Twilio credentials.' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send SMS
    console.log('[Twilio-SMS] Sending SMS to:', body.to.substring(0, 6) + '****');
    const result = await sendTwilioSMS(credentials, body);

    console.log('[Twilio-SMS] SMS sent successfully:', result.sid);

    // Log to system_logs
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'twilio-sms',
      message: `SMS sent to ${body.to.substring(0, 6)}****`,
      details: {
        sid: result.sid,
        status: result.status,
        hasMedia: (body.mediaUrls?.length || 0) > 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        sid: result.sid,
        status: result.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Twilio-SMS] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
