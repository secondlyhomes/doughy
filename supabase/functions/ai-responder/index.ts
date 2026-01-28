/**
 * AI Responder Edge Function
 *
 * Generates AI responses for guest/lead messages with confidence scores.
 * Uses OpenAI to generate contextually appropriate responses based on
 * contact history, property details, and conversation context.
 *
 * @see /docs/doughy-architecture-refactor.md for API contracts
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  content_type: string;
  sent_by: 'contact' | 'ai' | 'user';
  ai_confidence?: number;
  created_at: string;
}

interface AIResponderRequest {
  contact_id: string;
  message: string;
  channel: string;
  context?: {
    property_id?: string;
    conversation_history?: Message[];
    score?: number;
    score_factors?: { factor: string; points: number }[];
  };
}

interface AIResponderResponse {
  response: string;
  confidence: number;
  suggested_actions: string[];
  should_auto_send: boolean;
}

// =============================================================================
// AI Response Generation
// =============================================================================

/**
 * Build system prompt for the AI based on context
 */
function buildSystemPrompt(context: {
  property?: any;
  contact?: any;
  ownerName: string;
  conversationHistory: Message[];
}): string {
  // TODO: Load owner preferences and response style from user settings
  // TODO: Include property-specific details (amenities, rates, rules)
  // TODO: Include contact history and previous interactions

  let prompt = `You are a helpful, friendly assistant for a furnished rental property owner named ${context.ownerName}.
Your job is to respond to inquiries from potential guests and current tenants.

COMMUNICATION STYLE:
- Be warm, professional, and helpful
- Use a conversational tone (not overly formal)
- Keep responses concise but complete
- Use bullet points for lists of information
- Include relevant details without overwhelming

IMPORTANT RULES:
- Never make up information - only use provided details
- If you don't have information, say you'll check and get back to them
- Always offer next steps or ask clarifying questions
- For maintenance issues, express empathy and provide timeline expectations
- For pricing questions, always mention that rates include utilities unless otherwise specified
`;

  if (context.property) {
    prompt += `\n\nPROPERTY DETAILS:
- Name: ${context.property.name}
- Address: ${context.property.address}, ${context.property.city}, ${context.property.state}
- Bedrooms: ${context.property.bedrooms}
- Bathrooms: ${context.property.bathrooms}
- Base Rate: $${context.property.base_rate}/${context.property.rate_type}
- Amenities: ${(context.property.amenities || []).join(', ') || 'Standard furnished amenities'}
`;
  }

  if (context.contact) {
    prompt += `\n\nCONTACT INFO:
- Name: ${context.contact.name}
- Type: ${(context.contact.contact_types || []).join(', ')}
- Source: ${context.contact.source}
`;
  }

  if (context.conversationHistory.length > 0) {
    prompt += '\n\nRECENT CONVERSATION HISTORY:\n';
    context.conversationHistory.slice(-10).forEach((msg) => {
      const sender = msg.sent_by === 'contact' ? 'Guest' : 'You';
      prompt += `${sender}: ${msg.content}\n`;
    });
  }

  return prompt;
}

/**
 * Calculate confidence score based on response characteristics
 */
function calculateConfidence(
  message: string,
  response: string,
  context: any
): number {
  let confidence = 0.7; // Base confidence

  // TODO: Implement more sophisticated confidence calculation
  // Factors to consider:
  // - Message clarity and specificity
  // - Available context (property, history)
  // - Question type (FAQ vs complex)
  // - Response completeness

  // Increase confidence for clear, simple questions
  const simpleQuestions = [
    'wifi', 'password', 'check-in', 'check-out', 'address', 'parking',
    'available', 'price', 'rate', 'amenities'
  ];
  const lowerMessage = message.toLowerCase();
  if (simpleQuestions.some(q => lowerMessage.includes(q))) {
    confidence += 0.1;
  }

  // Increase confidence if we have property context
  if (context?.property_id) {
    confidence += 0.1;
  }

  // Decrease confidence for money-related topics
  const moneyTopics = ['refund', 'discount', 'negotiate', 'deposit', 'payment'];
  if (moneyTopics.some(t => lowerMessage.includes(t))) {
    confidence -= 0.2;
  }

  // Decrease confidence for complaints
  const complaintWords = ['complaint', 'unhappy', 'disappointed', 'terrible', 'worst'];
  if (complaintWords.some(w => lowerMessage.includes(w))) {
    confidence -= 0.3;
  }

  // Cap confidence
  return Math.max(0.1, Math.min(0.95, confidence));
}

/**
 * Determine suggested actions based on message content
 */
function determineSuggestedActions(message: string, response: string): string[] {
  const actions: string[] = [];
  const lowerMessage = message.toLowerCase();

  // TODO: Add more intelligent action detection

  if (lowerMessage.includes('tour') || lowerMessage.includes('visit') || lowerMessage.includes('see')) {
    actions.push('schedule_tour');
  }

  if (lowerMessage.includes('apply') || lowerMessage.includes('application')) {
    actions.push('send_application');
  }

  if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
    actions.push('create_booking');
  }

  if (lowerMessage.includes('extend') || lowerMessage.includes('stay longer')) {
    actions.push('check_extension_availability');
  }

  if (lowerMessage.includes('broken') || lowerMessage.includes('not working') || lowerMessage.includes('issue')) {
    actions.push('log_maintenance_request');
  }

  return actions;
}

/**
 * Determine if response should be auto-sent
 */
function shouldAutoSend(
  confidence: number,
  message: string,
  suggestedActions: string[]
): boolean {
  // TODO: Check user's auto-send settings
  // TODO: Check contact history for previous issues

  // Never auto-send for maintenance or money issues
  const requiresReview = ['log_maintenance_request'];
  if (suggestedActions.some(a => requiresReview.includes(a))) {
    return false;
  }

  // Only auto-send if confidence is high enough
  if (confidence < 0.85) {
    return false;
  }

  // Check for sensitive topics
  const sensitiveTopics = ['refund', 'money', 'deposit', 'problem', 'complaint', 'cancel'];
  const lowerMessage = message.toLowerCase();
  if (sensitiveTopics.some(t => lowerMessage.includes(t))) {
    return false;
  }

  return true;
}

/**
 * Call OpenAI API to generate response
 */
async function generateAIResponse(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  // TODO: Get API key from database or environment
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiApiKey) {
    // Return a placeholder response if no API key
    console.warn('OpenAI API key not configured, returning placeholder response');
    return `Thank you for your message! I've received your inquiry and will get back to you shortly with more details.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || 'Unable to generate response';

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: AIResponderRequest = await req.json();
    const { contact_id, message, channel, context } = body;

    // Validate required fields
    if (!contact_id || !message) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing contact_id or message' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError) {
      console.error('Error fetching contact:', contactError);
    }

    // Fetch property details if provided
    let property = null;
    if (context?.property_id) {
      const { data, error } = await supabase
        .from('rental_properties')
        .select('*')
        .eq('id', context.property_id)
        .single();
      if (!error) {
        property = data;
      }
    }

    // Fetch owner details
    // TODO: Get owner name from user profile
    const ownerName = 'Your Host';

    // Build conversation history
    const conversationHistory = context?.conversation_history || [];

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      property,
      contact,
      ownerName,
      conversationHistory
    });

    // Generate AI response
    const generatedResponse = await generateAIResponse(systemPrompt, message);

    // Calculate confidence
    const confidence = calculateConfidence(message, generatedResponse, context);

    // Determine suggested actions
    const suggestedActions = determineSuggestedActions(message, generatedResponse);

    // Determine if should auto-send
    const autoSend = shouldAutoSend(confidence, message, suggestedActions);

    const result: AIResponderResponse = {
      response: generatedResponse,
      confidence,
      suggested_actions: suggestedActions,
      should_auto_send: autoSend
    };

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('AI responder error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
