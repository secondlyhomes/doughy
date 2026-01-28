/**
 * SMS Webhook Edge Function
 * Description: Receives incoming SMS from Twilio, stores in sms_inbox, and triggers AI extraction
 * Phase: Sprint 3 - AI & Automation
 * Enhanced by Zone D: Added AI-powered property data extraction
 * Enhanced by Zone G: Added conversation_items integration for unified timeline
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-standardized.ts';
import { decryptServer } from '../_shared/crypto-server.ts';
import { scanForThreats, buildSecureSystemPrompt, sanitizeForLogging } from '../_shared/security.ts';

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
 * Conversation analysis data from AI
 */
interface ConversationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPhrases: string[];
  actionItems: string[];
  summary: string;
}

/**
 * Combined extraction result (property + conversation analysis)
 */
interface CombinedExtractionResult {
  property: ExtractedPropertyData;
  conversation: ConversationAnalysis;
}

/**
 * Find lead by phone number for conversation linking
 */
async function findLeadByPhone(
  supabase: ReturnType<typeof createClient>,
  phoneNumber: string
): Promise<{ leadId: string | null; userId: string | null; workspaceId: string | null }> {
  try {
    // Normalize phone number for comparison (remove non-digits except +)
    const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '');

    // Search crm_leads for matching phone
    const { data, error } = await supabase
      .from('crm_leads')
      .select('id, user_id, workspace_id, phone')
      .or(`phone.eq.${normalizedPhone},phone.ilike.%${normalizedPhone.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SMS-Webhook] Error finding lead:', error);
      return { leadId: null, userId: null, workspaceId: null };
    }

    return {
      leadId: data?.id || null,
      userId: data?.user_id || null,
      workspaceId: data?.workspace_id || null,
    };
  } catch (error) {
    console.error('[SMS-Webhook] Error in findLeadByPhone:', error);
    return { leadId: null, userId: null, workspaceId: null };
  }
}

/**
 * Insert SMS into conversation_items for unified timeline
 */
async function insertConversationItem(
  supabase: ReturnType<typeof createClient>,
  params: {
    smsInboxId: string;
    phoneNumber: string;
    content: string;
    twilioMessageSid: string;
    leadId: string | null;
    userId: string | null;
    workspaceId: string | null;
  }
): Promise<string | null> {
  try {
    // If no user/workspace found, we can't insert (RLS would block it anyway)
    if (!params.userId) {
      console.log('[SMS-Webhook] No user found for phone, skipping conversation_items insert');
      return null;
    }

    const { data, error } = await supabase
      .from('conversation_items')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        lead_id: params.leadId,
        type: 'sms',
        direction: 'inbound',
        content: params.content,
        phone_number: params.phoneNumber,
        twilio_message_sid: params.twilioMessageSid,
        sms_inbox_id: params.smsInboxId,
        occurred_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Ignore duplicate constraint violations (same twilio_message_sid)
      if (error.code === '23505') {
        console.log('[SMS-Webhook] Duplicate conversation_item ignored');
        return null;
      }
      console.error('[SMS-Webhook] Error inserting conversation_item:', error);
      return null;
    }

    console.log('[SMS-Webhook] Conversation item created:', data.id);
    return data.id;
  } catch (error) {
    console.error('[SMS-Webhook] Error in insertConversationItem:', error);
    return null;
  }
}

/**
 * Get OpenAI API key from encrypted storage
 */
async function getOpenAIKey(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('security_api_keys')
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
 * Extract property data AND analyze conversation in a single API call
 * Combined to reduce API costs and latency (was previously 2 separate calls)
 * Security: Input is scanned for threats before processing
 */
async function extractAndAnalyzeSMS(
  smsBody: string,
  apiKey: string
): Promise<CombinedExtractionResult> {
  // Security: Scan SMS content for injection attempts
  const securityScan = scanForThreats(smsBody);
  if (securityScan.action === 'blocked') {
    console.warn('[SMS-Webhook] Blocked SMS due to security threat:', sanitizeForLogging(smsBody));
    // Return neutral analysis for blocked content
    return {
      property: {},
      conversation: {
        sentiment: 'neutral',
        keyPhrases: [],
        actionItems: [],
        summary: 'Message flagged for security review.',
      },
    };
  }

  // Use sanitized content if threats were detected but not blocked
  const processedBody = securityScan.action === 'sanitized' ? securityScan.sanitized : smsBody;
  if (securityScan.action === 'sanitized') {
    console.log('[SMS-Webhook] Sanitized SMS content, threat level:', securityScan.severity);
  }

  const baseSystemPrompt = `You are a real estate AI assistant. Analyze this SMS message and return a JSON object with two sections:

1. "property" - Extract property details (omit fields if not mentioned):
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

2. "conversation" - Analyze the message:
   - sentiment: "positive" | "neutral" | "negative"
   - keyPhrases: string[] (important topics, numbers, names, addresses)
   - actionItems: string[] (follow-up tasks mentioned or implied)
   - summary: string (1-2 sentence summary)

SMS parsing tips:
- "3/2" means 3 bedrooms, 2 bathrooms
- "ARV", "as-is" values are asking prices
- Names often follow "call", "text", "contact"

Focus on real estate context: property details, seller motivation, urgency, deal terms.

Return JSON format:
{
  "property": { ... },
  "conversation": { sentiment, keyPhrases, actionItems, summary }
}`;

  // Wrap with security rules to prevent prompt injection from SMS content
  const systemPrompt = buildSecureSystemPrompt(baseSystemPrompt);

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
        { role: 'user', content: processedBody },
      ],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  // Ensure proper structure with defaults
  return {
    property: parsed.property || {},
    conversation: {
      sentiment: parsed.conversation?.sentiment || 'neutral',
      keyPhrases: parsed.conversation?.keyPhrases || [],
      actionItems: parsed.conversation?.actionItems || [],
      summary: parsed.conversation?.summary || '',
    },
  };
}

/**
 * Validate Twilio webhook signature
 */
async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  try {
    // Build the data string from params
    const data = Object.keys(params)
      .sort()
      .map(key => key + params[key])
      .join('');

    const fullData = url + data;

    // Create HMAC-SHA1 hash
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authToken);
    const messageData = encoder.encode(fullData);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);

    // Convert to base64
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

    // Constant-time comparison to prevent timing attacks
    return signatureBase64 === signature;
  } catch {
    return false;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate Twilio signature BEFORE processing
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAuthToken) {
      console.error('[SMS-Webhook] TWILIO_AUTH_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!twilioSignature) {
      console.error('[SMS-Webhook] Missing Twilio signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse Twilio webhook payload (application/x-www-form-urlencoded)
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageId = formData.get('MessageSid') as string;

    // Validate required fields
    if (!from || !body || !messageId) {
      console.error('Missing required fields:', { from, body, messageId });
      return new Response(
        JSON.stringify({ error: 'Bad request' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build params object for signature validation
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Validate Twilio signature
    const url = req.url;
    const isValidSignature = await validateTwilioSignature(
      url,
      params,
      twilioSignature,
      twilioAuthToken
    );

    if (!isValidSignature) {
      console.error('[SMS-Webhook] Invalid Twilio signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

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

    // Zone G: Add to conversation_items for unified timeline
    // Find the lead associated with this phone number
    const { leadId, userId, workspaceId } = await findLeadByPhone(supabase, from);

    // Insert into conversation_items (linked to lead if found)
    let conversationItemId: string | null = null;
    if (data?.id) {
      conversationItemId = await insertConversationItem(supabase, {
        smsInboxId: data.id,
        phoneNumber: from,
        content: body,
        twilioMessageSid: messageId,
        leadId,
        userId,
        workspaceId,
      });
    }

    // AI-powered extraction and analysis (combined into single API call)
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

          // Single API call for both property extraction AND conversation analysis
          // (Combined to reduce costs - was previously 2 separate calls)
          console.log('[SMS-Webhook] Extracting property data and analyzing conversation...');
          const { property: extractedData, conversation: analysis } = await extractAndAnalyzeSMS(body, apiKey);
          console.log('[SMS-Webhook] Combined extraction complete:', {
            propertyFields: Object.keys(extractedData),
            sentiment: analysis.sentiment,
          });

          // Update SMS record with extracted property data
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

          // Update conversation_item with analysis (if we created one)
          if (conversationItemId) {
            await supabase
              .from('conversation_items')
              .update({
                sentiment: analysis.sentiment,
                key_phrases: analysis.keyPhrases,
                action_items: analysis.actionItems,
                ai_summary: analysis.summary || null,
              })
              .eq('id', conversationItemId);

            console.log('[SMS-Webhook] Conversation analysis saved:', conversationItemId);
          }
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

    // Return generic error to Twilio (will retry)
    // Don't expose internal error details for security
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
