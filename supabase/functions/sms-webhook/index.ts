/**
 * SMS Webhook Edge Function
 * Description: Receives incoming SMS from Twilio, stores in sms_inbox, and triggers AI extraction
 * Phase: Sprint 3 - AI & Automation
 * Enhanced by Zone D: Added AI-powered property data extraction
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-standardized.ts';
import { decryptServer } from '../_shared/crypto-server.ts';

/**
 * Extracted property data from SMS text
 */
interface ExtractedPropertyData {
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  condition?: string;
  notes?: string;
  sellerName?: string;
  sellerPhone?: string;
  askingPrice?: number;
  yearBuilt?: number;
  lotSize?: number;
}

/**
 * Get OpenAI API key from encrypted storage
 */
async function getOpenAIKey(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_ciphertext')
      .or('service.eq.openai,service.eq.openai-key,service.eq.openai_key')
      .maybeSingle();

    if (error || !data?.key_ciphertext) {
      console.error('[SMS-Webhook] No OpenAI key found:', error?.message);
      return null;
    }

    return await decryptServer(data.key_ciphertext);
  } catch (error) {
    console.error('[SMS-Webhook] Error getting OpenAI key:', error);
    return null;
  }
}

/**
 * Extract property data from SMS text using GPT-4
 */
async function extractPropertyFromSMS(
  smsBody: string,
  apiKey: string
): Promise<ExtractedPropertyData> {
  const systemPrompt = `You are a real estate data extraction assistant. Extract property details from incoming SMS messages.
Return ONLY a JSON object with these fields (omit if not mentioned):
- address: string
- bedrooms: number
- bathrooms: number
- sqft: number
- condition: string (e.g., "needs work", "good condition", "updated")
- notes: string (repair needs, features, motivation to sell)
- sellerName: string
- sellerPhone: string
- askingPrice: number
- yearBuilt: number
- lotSize: number (in sqft)

SMS messages are often informal. Look for:
- "3/2" means 3 bedrooms, 2 bathrooms
- "ARV", "as-is" values are asking prices
- Names might follow "call", "text", "contact"

If information is not mentioned, omit that field. Do not make assumptions.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: smsBody },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content) as ExtractedPropertyData;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook payload (application/x-www-form-urlencoded)
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageId = formData.get('MessageSid') as string;

    // Validate required fields
    if (!from || !body || !messageId) {
      console.error('Missing required fields:', { from, body, messageId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: From, Body, or MessageSid' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('SMS received:', { from, bodyLength: body.length, messageId });

    // Store raw SMS in inbox for processing
    const { data, error } = await supabase
      .from('sms_inbox')
      .insert({
        phone_number: from,
        message_body: body,
        twilio_message_id: messageId,
        status: 'pending_review',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting SMS into inbox:', error);

      // Check if it's a duplicate message (unique constraint violation)
      if (error.code === '23505') {
        console.log('Duplicate message ignored:', messageId);
        // Still return success to Twilio (already processed)
      } else {
        throw error;
      }
    } else {
      console.log('SMS stored in inbox:', data.id);
    }

    // AI-powered property extraction (Zone D enhancement)
    // Run async - don't block Twilio response (must reply within 10s)
    const smsId = data?.id;
    if (smsId && body.length > 10) {
      // Process AI extraction in background
      (async () => {
        try {
          // Update status to processing
          await supabase
            .from('sms_inbox')
            .update({ status: 'processing' })
            .eq('id', smsId);

          // Get OpenAI API key
          const apiKey = await getOpenAIKey(supabase);
          if (!apiKey) {
            throw new Error('OpenAI API key not available');
          }

          // Extract property data using GPT-4
          console.log('[SMS-Webhook] Extracting property data from SMS...');
          const extractedData = await extractPropertyFromSMS(body, apiKey);
          console.log('[SMS-Webhook] Extraction complete:', Object.keys(extractedData));

          // Update SMS record with extracted data
          const hasUsefulData = Object.keys(extractedData).length > 0;
          await supabase
            .from('sms_inbox')
            .update({
              status: hasUsefulData ? 'processed' : 'pending_review',
              parsed_data: extractedData,
              processed_at: hasUsefulData ? new Date().toISOString() : null,
            })
            .eq('id', smsId);

          console.log('[SMS-Webhook] SMS processed successfully:', smsId);
        } catch (aiError) {
          console.error('[SMS-Webhook] AI extraction failed:', aiError);
          // Mark as error but don't fail the webhook
          await supabase
            .from('sms_inbox')
            .update({
              status: 'error',
              error_message: aiError instanceof Error ? aiError.message : 'AI extraction failed',
            })
            .eq('id', smsId);
        }
      })();
    }

    // Send TwiML response to acknowledge receipt
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks! We received your property details and will review them shortly. Someone from our team will reach out soon.</Message>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error processing SMS webhook:', error);

    // Return error to Twilio (will retry)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
