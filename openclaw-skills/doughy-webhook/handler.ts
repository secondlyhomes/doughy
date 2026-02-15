// openclaw-skills/doughy-webhook/handler.ts
// OpenClaw webhook handler for processing incoming rental platform emails
// This orchestrates all Doughy Edge Functions to handle the complete flow

import Anthropic from '@anthropic-ai/sdk';

// Configuration - set these via environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Default confidence threshold (can be overridden per user via settings)
const DEFAULT_CONFIDENCE_THRESHOLD = 85;

// Types
interface IncomingEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  messageId?: string;
  threadId?: string;
}

interface ParsedEmail {
  platform: string;
  replyMethod: 'email_reply' | 'direct_email' | 'platform_only' | 'messenger';
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    profession: string | null;
    employer: string | null;
  };
  inquiry: {
    message: string;
    propertyHint: string | null;
    dates: { start: string | null; end: string | null } | null;
  };
  metadata: Record<string, unknown>;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  contact_types: string[];
  source: string;
  status: string;
}

interface LeadScore {
  score: number;
  qualification: string;
  factors: Array<{ factor: string; impact: number; reason: string }>;
  recommendation: string;
}

interface AIResponse {
  suggestedResponse: string;
  confidence: number;
  reason: string;
  requiresReview: boolean;
}

interface WebhookResult {
  success: boolean;
  contactId?: string;
  conversationId?: string;
  messageId?: string;
  leadScore?: LeadScore;
  aiResponse?: AIResponse;
  action: 'auto_sent' | 'queued_for_review' | 'manual_required' | 'error';
  error?: string;
}

// Helper to call Supabase Edge Functions
async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  userToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken || SUPABASE_SERVICE_KEY}`,
  };

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge function ${functionName} failed: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// Get user's landlord settings from database
async function getUserSettings(userId: string): Promise<{
  aiMode: 'autonomous' | 'assisted' | 'training' | 'off';
  confidenceThreshold: number;
  alwaysReviewTopics: string[];
  responseStyle: string;
}> {
  // In production, this would query user_platform_settings table
  // For now, return defaults
  return {
    aiMode: 'assisted',
    confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
    alwaysReviewTopics: ['refund', 'discount', 'complaint', 'maintenance', 'emergency'],
    responseStyle: 'friendly',
  };
}

// Check if message contains topics that always require review
function containsSensitiveTopic(message: string, topics: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return topics.some(topic => lowerMessage.includes(topic.toLowerCase()));
}

// Main webhook handler
export async function handleIncomingEmail(
  email: IncomingEmail,
  userId: string,
  userToken?: string
): Promise<WebhookResult> {
  console.log(`[Webhook] Processing email from ${email.from}: "${email.subject}"`);

  try {
    // Step 1: Parse the email to extract platform and contact info
    console.log('[Webhook] Step 1: Parsing email...');
    const parsed = await callEdgeFunction<ParsedEmail>(
      'platform-email-parser',
      {
        from: email.from,
        subject: email.subject,
        body: email.body,
      },
      userToken
    );
    console.log(`[Webhook] Detected platform: ${parsed.platform}, reply method: ${parsed.replyMethod}`);

    // Step 2: Create or update contact via openclaw-bridge
    console.log('[Webhook] Step 2: Creating/updating contact...');
    const contactResult = await callEdgeFunction<{ contact: Contact; isNew: boolean }>(
      'openclaw-bridge',
      {
        action: 'UPSERT_CONTACT',
        user_id: userId,
        contact: {
          first_name: parsed.contact.firstName || 'Unknown',
          last_name: parsed.contact.lastName || '',
          email: parsed.contact.email,
          phone: parsed.contact.phone,
          contact_types: ['lead'],
          source: parsed.platform,
          status: 'new',
          metadata: {
            profession: parsed.contact.profession,
            employer: parsed.contact.employer,
            ...parsed.metadata,
          },
        },
      },
      userToken
    );
    console.log(`[Webhook] Contact ${contactResult.isNew ? 'created' : 'updated'}: ${contactResult.contact.id}`);

    // Step 3: Find matching property (if property hint provided)
    let propertyId: string | null = null;
    if (parsed.inquiry.propertyHint) {
      console.log('[Webhook] Step 3: Matching property...');
      try {
        const propertyResult = await callEdgeFunction<{ property: { id: string } | null }>(
          'openclaw-bridge',
          {
            action: 'GET_PROPERTY',
            user_id: userId,
            address_hint: parsed.inquiry.propertyHint,
          },
          userToken
        );
        propertyId = propertyResult.property?.id || null;
        console.log(`[Webhook] Property match: ${propertyId || 'none found'}`);
      } catch (err) {
        console.log('[Webhook] Property match failed, continuing without property');
      }
    }

    // Step 4: Create conversation and log inbound message
    console.log('[Webhook] Step 4: Creating conversation...');
    const conversationResult = await callEdgeFunction<{
      conversation: { id: string };
      message: { id: string };
    }>(
      'openclaw-bridge',
      {
        action: 'CREATE_CONVERSATION',
        user_id: userId,
        conversation: {
          contact_id: contactResult.contact.id,
          property_id: propertyId,
          channel: parsed.platform === 'direct' ? 'email' : parsed.platform,
          status: 'active',
          platform_thread_id: email.threadId,
        },
        initial_message: {
          content: parsed.inquiry.message,
          direction: 'inbound',
          sent_by: 'contact',
          platform_message_id: email.messageId,
        },
      },
      userToken
    );
    console.log(`[Webhook] Conversation created: ${conversationResult.conversation.id}`);

    // Step 5: Score the lead
    console.log('[Webhook] Step 5: Scoring lead...');
    const leadScore = await callEdgeFunction<LeadScore>(
      'lead-scorer',
      {
        contact: contactResult.contact,
        message: parsed.inquiry.message,
        source: parsed.platform,
        metadata: {
          profession: parsed.contact.profession,
          employer: parsed.contact.employer,
          dates: parsed.inquiry.dates,
        },
      },
      userToken
    );
    console.log(`[Webhook] Lead score: ${leadScore.score}/100 (${leadScore.qualification})`);

    // Update contact with lead score
    await callEdgeFunction(
      'openclaw-bridge',
      {
        action: 'UPDATE_CONTACT',
        user_id: userId,
        contact_id: contactResult.contact.id,
        updates: {
          lead_score: leadScore.score,
          lead_qualification: leadScore.qualification,
        },
      },
      userToken
    );

    // Step 6: Get user settings to determine AI behavior
    console.log('[Webhook] Step 6: Getting user settings...');
    const settings = await getUserSettings(userId);

    // If AI is off, stop here
    if (settings.aiMode === 'off') {
      console.log('[Webhook] AI mode is off, skipping response generation');
      return {
        success: true,
        contactId: contactResult.contact.id,
        conversationId: conversationResult.conversation.id,
        messageId: conversationResult.message.id,
        leadScore,
        action: 'manual_required',
      };
    }

    // Step 7: Generate AI response
    console.log('[Webhook] Step 7: Generating AI response...');
    const aiResponse = await callEdgeFunction<AIResponse>(
      'ai-responder',
      {
        user_id: userId,
        conversation_id: conversationResult.conversation.id,
        contact: contactResult.contact,
        property_id: propertyId,
        message: parsed.inquiry.message,
        lead_score: leadScore,
        response_style: settings.responseStyle,
      },
      userToken
    );
    console.log(`[Webhook] AI response generated (confidence: ${aiResponse.confidence}%)`);

    // Step 8: Decide whether to auto-send or queue for review
    const hasSensitiveTopic = containsSensitiveTopic(
      parsed.inquiry.message,
      settings.alwaysReviewTopics
    );

    const shouldAutoSend =
      settings.aiMode === 'autonomous' ||
      (settings.aiMode === 'assisted' &&
        aiResponse.confidence >= settings.confidenceThreshold &&
        !hasSensitiveTopic &&
        parsed.replyMethod !== 'platform_only' &&
        parsed.replyMethod !== 'messenger');

    if (shouldAutoSend && (parsed.replyMethod === 'email_reply' || parsed.replyMethod === 'direct_email')) {
      // Auto-send the response
      console.log('[Webhook] Step 8: Auto-sending response...');

      // Log outbound message
      await callEdgeFunction(
        'openclaw-bridge',
        {
          action: 'LOG_MESSAGE',
          user_id: userId,
          conversation_id: conversationResult.conversation.id,
          message: {
            content: aiResponse.suggestedResponse,
            direction: 'outbound',
            sent_by: 'ai',
            ai_confidence: aiResponse.confidence,
          },
        },
        userToken
      );

      // TODO: Actually send the email via resend-email function
      // await callEdgeFunction('resend-email', { ... });

      // Send push notification about what was sent
      await callEdgeFunction(
        'notification-push',
        {
          user_id: userId,
          title: `AI responded to ${contactResult.contact.first_name}`,
          body: `Lead score: ${leadScore.score}/100. Tap to review.`,
          data: {
            type: 'ai_sent',
            conversation_id: conversationResult.conversation.id,
          },
        },
        userToken
      );

      return {
        success: true,
        contactId: contactResult.contact.id,
        conversationId: conversationResult.conversation.id,
        messageId: conversationResult.message.id,
        leadScore,
        aiResponse,
        action: 'auto_sent',
      };
    } else {
      // Queue for review
      console.log('[Webhook] Step 8: Queueing response for review...');

      const queueReason = hasSensitiveTopic
        ? 'Contains sensitive topic'
        : parsed.replyMethod === 'platform_only' || parsed.replyMethod === 'messenger'
        ? `Requires ${parsed.replyMethod} reply`
        : aiResponse.confidence < settings.confidenceThreshold
        ? `Confidence ${aiResponse.confidence}% below threshold ${settings.confidenceThreshold}%`
        : 'Training mode active';

      // Add to AI response queue
      await callEdgeFunction(
        'openclaw-bridge',
        {
          action: 'QUEUE_AI_RESPONSE',
          user_id: userId,
          queue_item: {
            conversation_id: conversationResult.conversation.id,
            message_id: conversationResult.message.id,
            suggested_response: aiResponse.suggestedResponse,
            confidence: aiResponse.confidence,
            reason: queueReason,
            status: 'pending',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          },
        },
        userToken
      );

      // Send push notification for review
      await callEdgeFunction(
        'notification-push',
        {
          user_id: userId,
          title: `Review needed: ${contactResult.contact.first_name}`,
          body: `${parsed.platform} lead (score: ${leadScore.score}). AI ready.`,
          data: {
            type: 'needs_review',
            conversation_id: conversationResult.conversation.id,
          },
        },
        userToken
      );

      return {
        success: true,
        contactId: contactResult.contact.id,
        conversationId: conversationResult.conversation.id,
        messageId: conversationResult.message.id,
        leadScore,
        aiResponse,
        action: 'queued_for_review',
      };
    }
  } catch (error) {
    console.error('[Webhook] Error processing email:', error);
    return {
      success: false,
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Express/HTTP handler wrapper (for use with OpenClaw server)
export async function webhookHttpHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.email || !body.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await handleIncomingEmail(
      body.email,
      body.userId,
      body.userToken
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default handleIncomingEmail;
