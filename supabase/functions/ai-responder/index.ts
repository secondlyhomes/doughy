/**
 * AI Responder Edge Function
 *
 * Generates AI responses for guest/lead messages with confidence scores.
 * Uses OpenAI to generate contextually appropriate responses based on
 * contact history, property details, and conversation context.
 *
 * Enhanced with:
 * - User-specific AI mode and confidence thresholds
 * - Adaptive learning from past review outcomes
 * - Contact-type-specific behavior (leads vs tenants)
 * - Topic detection for sensitive content
 * - Outcome logging for learning
 * - Security scanning for prompt injection and data exfiltration
 * - Memory system integration for personalized responses
 *
 * @see /docs/doughy-architecture-refactor.md for API contracts
 * @see /docs/moltbot-ecosystem-expansion.md for security architecture
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";
import {
  scanForThreats,
  filterOutput,
  buildSecureSystemPrompt,
  quickThreatCheck,
  createSecurityLogEntry,
  shouldLogSecurityEvent,
  type SecurityScanResult,
  type OutputFilterResult,
} from "../_shared/security.ts";

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
  user_id: string;
  contact_id: string;
  conversation_id?: string;
  message: string;
  message_id?: string;
  channel: string;
  platform?: string;
  context?: {
    property_id?: string;
    conversation_history?: Message[];
    score?: number;
    score_factors?: { factor: string; points: number }[];
  };
}

interface LandlordSettings {
  ai_mode: 'training' | 'assisted' | 'autonomous';
  ai_auto_respond: boolean;
  confidence_threshold: number;
  always_review_topics: string[];
  notify_for_contact_types: string[];
  response_style: 'friendly' | 'professional' | 'brief';
  notifications: {
    new_leads: boolean;
    ai_needs_review: boolean;
    booking_requests: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
  };
  ai_personality: {
    use_emojis: boolean;
    greeting_style: string;
    sign_off: string;
    owner_name: string | null;
  };
  learning: {
    enabled: boolean;
    min_samples_for_auto_adjust: number;
    recalculate_frequency_days: number;
  };
  lead_settings: {
    fast_response_enabled: boolean;
    lead_confidence_threshold: number;
    always_notify_on_lead_response: boolean;
    auto_score_leads: boolean;
  };
}

interface AIResponderResponse {
  response: string;
  confidence: number;
  adjusted_confidence: number;
  suggested_actions: string[];
  detected_topics: string[];
  should_auto_send: boolean;
  requires_review_reason?: string;
  message_type: string;
  queued?: boolean;
  queue_id?: string;
  security_blocked?: boolean;
  security_sanitized?: boolean;
}

// Memory context structure
interface MemoryContext {
  user_memories?: {
    preferences?: Record<string, unknown>;
    writing_style?: Record<string, unknown>;
    property_rules?: unknown[];
    contact_rules?: unknown[];
    personality_traits?: Record<string, unknown>;
  };
  contact_memories?: Array<{
    memory_type: string;
    summary: string;
    key_facts?: Record<string, unknown>;
    sentiment?: string;
  }>;
  global_knowledge?: Array<{
    category: string;
    key: string;
    value: unknown;
  }>;
}

// Default settings if user hasn't configured
const DEFAULT_SETTINGS: LandlordSettings = {
  ai_mode: 'assisted',
  ai_auto_respond: true,
  confidence_threshold: 85,
  always_review_topics: ['refund', 'discount', 'complaint', 'cancellation', 'damage', 'security_deposit'],
  notify_for_contact_types: ['lead'],
  response_style: 'friendly',
  notifications: {
    new_leads: true,
    ai_needs_review: true,
    booking_requests: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  },
  ai_personality: {
    use_emojis: false,
    greeting_style: 'Hi {first_name}!',
    sign_off: 'Best',
    owner_name: null,
  },
  learning: {
    enabled: true,
    min_samples_for_auto_adjust: 10,
    recalculate_frequency_days: 7,
  },
  lead_settings: {
    fast_response_enabled: true,
    lead_confidence_threshold: 70,
    always_notify_on_lead_response: true,
    auto_score_leads: true,
  },
};

// =============================================================================
// Topic Detection
// =============================================================================

const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  wifi: [/wifi/i, /password/i, /internet/i, /network/i],
  pricing: [/price/i, /rate/i, /cost/i, /fee/i, /how much/i, /\$\d+/],
  availability: [/available/i, /open/i, /vacancy/i, /when can/i],
  check_in: [/check.?in/i, /arrival/i, /access/i, /key/i, /code/i, /door/i],
  check_out: [/check.?out/i, /departure/i, /leave/i, /last day/i],
  amenities: [/amenities/i, /parking/i, /laundry/i, /washer/i, /dryer/i, /kitchen/i],
  maintenance: [/broken/i, /not working/i, /fix/i, /repair/i, /issue/i, /problem/i, /leak/i],
  refund: [/refund/i, /money back/i, /reimburse/i],
  discount: [/discount/i, /deal/i, /lower price/i, /negotiate/i, /reduce/i],
  complaint: [/complaint/i, /unhappy/i, /disappointed/i, /terrible/i, /worst/i, /unacceptable/i],
  cancellation: [/cancel/i, /not coming/i, /can't make it/i],
  extension: [/extend/i, /stay longer/i, /more time/i, /extra week/i, /extra month/i],
  booking: [/book/i, /reserve/i, /hold/i, /secure/i],
  tour: [/tour/i, /visit/i, /see the place/i, /viewing/i, /look at/i],
  security_deposit: [/deposit/i, /security/i],
  damage: [/damage/i, /broke/i, /stain/i, /scratch/i],
  pets: [/pet/i, /dog/i, /cat/i, /animal/i],
  guests: [/guest/i, /visitor/i, /friend staying/i, /partner/i, /girlfriend/i, /boyfriend/i],
};

function detectTopics(message: string): string[] {
  const detected: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (patterns.some(p => p.test(lowerMessage))) {
      detected.push(topic);
    }
  }

  return detected;
}

function classifyMessageType(message: string, topics: string[]): string {
  const lowerMessage = message.toLowerCase();

  // Check for complaints first
  if (topics.includes('complaint') || topics.includes('damage')) {
    return 'complaint';
  }

  // Check for booking-related
  if (topics.includes('booking') || topics.includes('availability')) {
    return 'booking_request';
  }

  // Check for maintenance
  if (topics.includes('maintenance')) {
    return 'maintenance';
  }

  // Check for FAQ topics
  const faqTopics = ['wifi', 'check_in', 'check_out', 'amenities', 'pricing'];
  if (topics.some(t => faqTopics.includes(t))) {
    return 'faq';
  }

  // Check for inquiry indicators
  if (lowerMessage.includes('?') || /looking for|interested in|inquire/i.test(lowerMessage)) {
    return 'inquiry';
  }

  return 'general';
}

// =============================================================================
// Security Functions
// =============================================================================

/**
 * Log a security event to the database
 */
async function logSecurityEvent(
  supabase: SupabaseClient,
  userId: string | null,
  scanResult: SecurityScanResult,
  channel?: string,
  rawInput?: string
): Promise<void> {
  if (!shouldLogSecurityEvent(scanResult)) {
    return;
  }

  try {
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: scanResult.threats[0] === 'prompt_injection' ? 'injection_attempt'
        : scanResult.threats[0] === 'data_exfiltration' ? 'exfil_attempt'
        : scanResult.threats[0] === 'jailbreak_attempt' ? 'jailbreak_attempt'
        : 'suspicious_pattern',
      p_severity: scanResult.severity,
      p_action_taken: scanResult.action,
      p_channel: channel || null,
      p_raw_input: rawInput?.substring(0, 1000) || null,
      p_detected_patterns: scanResult.threatDetails.map(t => t.pattern),
      p_risk_score: scanResult.riskScore,
      p_metadata: JSON.stringify({ threats: scanResult.threats }),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// =============================================================================
// Memory Functions
// =============================================================================

/**
 * Load user memory context for personalized responses
 */
async function loadMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  propertyId?: string,
  channel?: string,
  contactType?: string,
  contactId?: string
): Promise<MemoryContext> {
  try {
    // Get user memories
    const { data: memoryContext } = await supabase.rpc('get_user_memory_context', {
      p_user_id: userId,
      p_property_id: propertyId || null,
      p_channel: channel || null,
      p_contact_type: contactType || null,
    });

    // Get contact episodic memories if contact_id provided
    let contactMemories = [];
    if (contactId) {
      const { data: episodic } = await supabase.rpc('get_contact_episodic_memories', {
        p_user_id: userId,
        p_contact_id: contactId,
        p_limit: 5,
      });

      if (episodic) {
        contactMemories = episodic;
      }
    }

    return {
      user_memories: memoryContext || {},
      contact_memories: contactMemories,
    };
  } catch (error) {
    console.error('Failed to load memory context:', error);
    return {};
  }
}

/**
 * Build memory context string for system prompt
 */
function buildMemoryPromptSection(memoryContext: MemoryContext): string {
  const sections: string[] = [];

  // Writing style preferences
  if (memoryContext.user_memories?.writing_style) {
    const style = memoryContext.user_memories.writing_style;
    const styleLines: string[] = [];

    if (style.formality_preference) {
      styleLines.push(`- Formality: ${style.formality_preference === 'more_formal' ? 'Use formal language' : 'Use casual language'}`);
    }
    if (style.response_length_preference) {
      styleLines.push(`- Length: ${style.response_length_preference === 'longer' ? 'Provide detailed responses' : 'Keep responses concise'}`);
    }

    if (styleLines.length > 0) {
      sections.push('LEARNED WRITING STYLE:\n' + styleLines.join('\n'));
    }
  }

  // Personality traits
  if (memoryContext.user_memories?.personality_traits) {
    const traits = memoryContext.user_memories.personality_traits;
    const traitLines: string[] = [];

    if (traits.emoji_usage) {
      traitLines.push(`- Emojis: ${traits.emoji_usage === 'preferred' ? 'Include appropriate emojis' : 'Avoid using emojis'}`);
    }

    if (traitLines.length > 0) {
      sections.push('PERSONALITY PREFERENCES:\n' + traitLines.join('\n'));
    }
  }

  // Property rules
  if (memoryContext.user_memories?.property_rules && Array.isArray(memoryContext.user_memories.property_rules)) {
    const rules = memoryContext.user_memories.property_rules;
    if (rules.length > 0) {
      sections.push('PROPERTY-SPECIFIC RULES:\n' + rules.map(r => `- ${JSON.stringify(r)}`).join('\n'));
    }
  }

  // Contact history
  if (memoryContext.contact_memories && memoryContext.contact_memories.length > 0) {
    const historyLines = memoryContext.contact_memories.map(m => {
      let line = `- ${m.summary}`;
      if (m.sentiment && m.sentiment !== 'neutral') {
        line += ` (${m.sentiment} interaction)`;
      }
      return line;
    });
    sections.push('PAST INTERACTIONS WITH THIS CONTACT:\n' + historyLines.join('\n'));
  }

  return sections.length > 0 ? '\n\n' + sections.join('\n\n') : '';
}

// =============================================================================
// AI Response Generation
// =============================================================================

function buildSystemPrompt(context: {
  property?: any;
  contact?: any;
  ownerName: string;
  conversationHistory: Message[];
  settings: LandlordSettings;
  contactType: string;
  memoryContext?: MemoryContext;
}): string {
  const { settings, contactType, memoryContext } = context;

  // Style-specific instructions
  const styleInstructions: Record<string, string> = {
    friendly: `
- Be warm, welcoming, and personable
- Use a conversational tone
- Include appropriate enthusiasm
${settings.ai_personality.use_emojis ? '- You may use emojis sparingly to convey warmth' : '- Do not use emojis'}`,
    professional: `
- Maintain a courteous, business-like tone
- Be respectful and formal
- Use proper grammar and complete sentences
- Do not use emojis or casual language`,
    brief: `
- Keep responses concise and to the point
- Use short sentences and bullet points
- Avoid unnecessary elaboration
- Focus on answering the specific question`,
  };

  // Greeting personalization
  const greeting = settings.ai_personality.greeting_style
    .replace('{first_name}', context.contact?.first_name || 'there')
    .replace('{name}', context.contact?.first_name || context.contact?.last_name || 'there');

  let prompt = `You are a helpful assistant responding on behalf of ${context.ownerName} who manages furnished rental properties.
Your role is to respond to ${contactType === 'lead' ? 'potential guests inquiring about rentals' : 'current guests and tenants'}.

COMMUNICATION STYLE:
${styleInstructions[settings.response_style] || styleInstructions.friendly}

GREETING: Start responses with something like "${greeting}"
SIGN-OFF: End with "${settings.ai_personality.sign_off}" followed by ${context.ownerName}

IMPORTANT RULES:
- Never make up information - only use provided details
- If you don't have specific information, say you'll check and get back to them
- Always offer next steps or ask clarifying questions when appropriate
- For maintenance issues, express empathy and provide timeline expectations
- For pricing questions, mention that rates include utilities unless otherwise specified
- Be helpful but do not make commitments about discounts, refunds, or policy exceptions
`;

  if (context.property) {
    prompt += `\n\nPROPERTY DETAILS:
- Name: ${context.property.name}
- Address: ${context.property.address}, ${context.property.city}, ${context.property.state}
- Bedrooms: ${context.property.bedrooms}
- Bathrooms: ${context.property.bathrooms}
- Base Rate: $${context.property.base_rate}/${context.property.rate_type}
- Amenities: ${(context.property.amenities || []).join(', ') || 'Standard furnished amenities'}
${context.property.house_rules ? `- House Rules: ${JSON.stringify(context.property.house_rules)}` : ''}
`;
  }

  if (context.contact) {
    const name = [context.contact.first_name, context.contact.last_name].filter(Boolean).join(' ') || 'Unknown';
    prompt += `\n\nCONTACT INFO:
- Name: ${name}
- Type: ${contactType}
- Source: ${context.contact.source || 'Unknown'}
${context.contact.metadata?.profession ? `- Profession: ${context.contact.metadata.profession}` : ''}
`;
  }

  if (context.conversationHistory.length > 0) {
    prompt += '\n\nRECENT CONVERSATION HISTORY:\n';
    context.conversationHistory.slice(-10).forEach((msg) => {
      const sender = msg.sent_by === 'contact' ? 'Guest' : 'You';
      prompt += `${sender}: ${msg.content}\n`;
    });
  }

  // Add memory context if available
  if (memoryContext) {
    prompt += buildMemoryPromptSection(memoryContext);
  }

  // Wrap with security rules
  return buildSecureSystemPrompt(prompt);
}

/**
 * Calculate base confidence score
 */
function calculateBaseConfidence(
  message: string,
  response: string,
  topics: string[],
  messageType: string,
  context: any
): number {
  let confidence = 0.70; // Base confidence

  // Simple FAQ questions get higher confidence
  const faqTopics = ['wifi', 'check_in', 'check_out', 'amenities', 'pricing', 'availability'];
  if (topics.some(t => faqTopics.includes(t)) && messageType === 'faq') {
    confidence += 0.15;
  }

  // Property context increases confidence
  if (context?.property_id) {
    confidence += 0.10;
  }

  // Conversation history helps
  if (context?.conversation_history?.length > 2) {
    confidence += 0.05;
  }

  // Sensitive topics decrease confidence
  const sensitiveTops = ['refund', 'discount', 'complaint', 'cancellation', 'damage', 'security_deposit'];
  if (topics.some(t => sensitiveTops.includes(t))) {
    confidence -= 0.25;
  }

  // Maintenance issues need review
  if (topics.includes('maintenance')) {
    confidence -= 0.15;
  }

  // Booking requests are important
  if (messageType === 'booking_request') {
    confidence -= 0.10;
  }

  // Cap confidence
  return Math.max(0.10, Math.min(0.95, confidence));
}

/**
 * Determine suggested actions based on message content
 */
function determineSuggestedActions(message: string, topics: string[]): string[] {
  const actions: string[] = [];

  if (topics.includes('tour')) {
    actions.push('schedule_tour');
  }

  if (topics.includes('booking') || topics.includes('availability')) {
    actions.push('check_availability');
  }

  if (topics.includes('extension')) {
    actions.push('check_extension_availability');
  }

  if (topics.includes('maintenance')) {
    actions.push('log_maintenance_request');
  }

  if (topics.includes('cancellation')) {
    actions.push('process_cancellation');
  }

  return actions;
}

/**
 * Validate OpenAI API response structure
 */
function validateOpenAIResponse(result: unknown): { valid: boolean; content?: string; error?: string } {
  if (!result || typeof result !== 'object') {
    return { valid: false, error: 'Invalid response: not an object' };
  }

  const response = result as Record<string, unknown>;

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    return { valid: false, error: 'Invalid response: missing or empty choices array' };
  }

  const firstChoice = response.choices[0] as Record<string, unknown> | undefined;
  if (!firstChoice || typeof firstChoice !== 'object') {
    return { valid: false, error: 'Invalid response: first choice is not an object' };
  }

  const message = firstChoice.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Invalid response: message is not an object' };
  }

  const content = message.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { valid: false, error: 'Invalid response: content is not a non-empty string' };
  }

  return { valid: true, content };
}

/**
 * Call OpenAI API to generate response
 */
async function generateAIResponse(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. AI responses are unavailable.');
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
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as Record<string, unknown>)?.error;
      const message = typeof errorMessage === 'object' && errorMessage !== null
        ? (errorMessage as Record<string, unknown>)?.message
        : undefined;
      throw new Error(typeof message === 'string' ? message : `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();

    const validation = validateOpenAIResponse(result);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid OpenAI response structure');
    }

    return validation.content!;

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
    // Try new SUPABASE_SECRET_KEY first, fall back to legacy SUPABASE_SERVICE_ROLE_KEY
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify authentication - MANDATORY
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Authentication required' }),
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
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Parse request
    const body: AIResponderRequest = await req.json();
    const { user_id, contact_id, conversation_id, message, message_id, channel, platform, context } = body;

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

    // Use authenticated user ID, ignore user_id from request body for security
    const authenticatedUserId = user.id;

    // ==========================================================================
    // SECURITY: Scan input for threats
    // ==========================================================================
    const securityScan = scanForThreats(message);

    if (securityScan.action === 'blocked') {
      // Log the security event
      await logSecurityEvent(supabase, authenticatedUserId, securityScan, channel, message);

      // Return a safe response without revealing threat detection
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            response: "I can only help with property management questions. How can I assist you today?",
            confidence: 1.0,
            adjusted_confidence: 1.0,
            suggested_actions: [],
            detected_topics: [],
            should_auto_send: false,
            requires_review_reason: 'Security review required',
            message_type: 'blocked',
            security_blocked: true,
          } as AIResponderResponse),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Log flagged content but continue processing
    if (securityScan.action === 'flagged' || securityScan.action === 'sanitized') {
      await logSecurityEvent(supabase, authenticatedUserId, securityScan, channel, message);
    }

    // Use sanitized message if content was modified
    const processedMessage = securityScan.sanitized;

    // Fetch user's landlord settings
    let settings: LandlordSettings = DEFAULT_SETTINGS;
    const { data: platformSettings } = await supabase
      .from('user_platform_settings')
      .select('landlord_settings')
      .eq('user_id', authenticatedUserId)
      .single();

    if (platformSettings?.landlord_settings) {
      settings = { ...DEFAULT_SETTINGS, ...platformSettings.landlord_settings };
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

    // Determine contact type (lead, guest, tenant)
    const contactTypes = contact?.contact_types || [];
    const contactType = contactTypes.includes('tenant') ? 'tenant'
      : contactTypes.includes('guest') ? 'guest'
      : 'lead';

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

    // Get owner name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', authenticatedUserId)
      .single();

    const ownerName = settings.ai_personality.owner_name
      || profile?.full_name
      || 'Your Host';

    // ==========================================================================
    // MEMORY: Load user memories and contact history for personalization
    // ==========================================================================
    const memoryContext = await loadMemoryContext(
      supabase,
      authenticatedUserId,
      context?.property_id,
      channel,
      contactType,
      contact_id
    );

    // Detect topics and classify message (use processed message)
    const detectedTopics = detectTopics(processedMessage);
    const messageType = classifyMessageType(processedMessage, detectedTopics);

    // Build conversation history
    const conversationHistory = context?.conversation_history || [];

    // Build system prompt with user settings and memory context
    const systemPrompt = buildSystemPrompt({
      property,
      contact,
      ownerName,
      conversationHistory,
      settings,
      contactType,
      memoryContext,
    });

    // Generate AI response (use processed/sanitized message)
    const generatedResponse = await generateAIResponse(systemPrompt, processedMessage);

    // ==========================================================================
    // SECURITY: Filter output for sensitive information
    // ==========================================================================
    const outputFilter = filterOutput(generatedResponse);
    const finalResponse = outputFilter.filtered;

    // Log if output was filtered
    if (!outputFilter.safe) {
      console.log('[Security] Output filtered:', outputFilter.redactions.length, 'redactions');
    }

    // Calculate base confidence
    const baseConfidence = calculateBaseConfidence(
      processedMessage,
      finalResponse,
      detectedTopics,
      messageType,
      context
    );

    // Reduce confidence if content was sanitized
    let securityConfidenceAdjustment = 0;
    if (securityScan.action === 'sanitized') {
      securityConfidenceAdjustment = -0.15;
    } else if (securityScan.action === 'flagged') {
      securityConfidenceAdjustment = -0.25;
    }

    // Apply adaptive learning adjustment if enabled
    let adjustedConfidence = baseConfidence;
    if (settings.learning.enabled) {
      const { data: adjustedValue } = await supabase.rpc('calculate_adaptive_confidence', {
        p_user_id: authenticatedUserId,
        p_message_type: messageType,
        p_topic: detectedTopics[0] || 'general',
        p_contact_type: contactType,
        p_base_confidence: baseConfidence,
      });

      if (adjustedValue !== null) {
        adjustedConfidence = adjustedValue;
      }
    }

    // Apply security confidence adjustment
    adjustedConfidence = Math.max(0.10, adjustedConfidence + securityConfidenceAdjustment);

    // Determine suggested actions
    const suggestedActions = determineSuggestedActions(processedMessage, detectedTopics);

    // Determine if should auto-send based on user settings and AI mode
    let shouldAutoSend = false;
    let requiresReviewReason: string | undefined;

    // Check for always-review topics
    const hasAlwaysReviewTopic = detectedTopics.some(t =>
      settings.always_review_topics.includes(t)
    );

    if (hasAlwaysReviewTopic) {
      requiresReviewReason = `Contains sensitive topic: ${detectedTopics.find(t => settings.always_review_topics.includes(t))}`;
    } else if (!settings.ai_auto_respond) {
      requiresReviewReason = 'Auto-respond is disabled';
    } else if (settings.ai_mode === 'training') {
      // Training mode: queue almost everything
      if (adjustedConfidence < 0.95) {
        requiresReviewReason = 'Training mode - building your preferences';
      } else {
        shouldAutoSend = true;
      }
    } else if (settings.ai_mode === 'autonomous') {
      // Autonomous mode: auto-send most things
      shouldAutoSend = adjustedConfidence >= 0.50 && !hasAlwaysReviewTopic;
      if (!shouldAutoSend) {
        requiresReviewReason = 'Confidence below autonomous threshold';
      }
    } else {
      // Assisted mode (default): check threshold based on contact type
      const threshold = contactType === 'lead' && settings.lead_settings.fast_response_enabled
        ? Math.min(settings.confidence_threshold, settings.lead_settings.lead_confidence_threshold) / 100
        : settings.confidence_threshold / 100;

      shouldAutoSend = adjustedConfidence >= threshold;
      if (!shouldAutoSend) {
        requiresReviewReason = `Confidence ${Math.round(adjustedConfidence * 100)}% below threshold ${Math.round(threshold * 100)}%`;
      }
    }

    // Maintenance requests always need review
    if (suggestedActions.includes('log_maintenance_request')) {
      shouldAutoSend = false;
      requiresReviewReason = 'Maintenance request requires review';
    }

    // Security-flagged content should not auto-send
    if (securityScan.action === 'flagged' || securityScan.action === 'sanitized') {
      shouldAutoSend = false;
      requiresReviewReason = requiresReviewReason || 'Security review recommended';
    }

    // Queue response if not auto-sending
    let queueId: string | undefined;
    if (!shouldAutoSend && conversation_id) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data: queueItem, error: queueError } = await supabase
        .from('rental_ai_queue')
        .insert({
          user_id: authenticatedUserId,
          conversation_id,
          trigger_message_id: message_id,
          suggested_response: finalResponse,
          confidence: Math.round(adjustedConfidence * 100),
          reasoning: requiresReviewReason,
          intent: messageType,
          detected_topics: detectedTopics,
          alternatives: [],
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single();

      if (!queueError && queueItem) {
        queueId = queueItem.id;
      }
    }

    // Log outcome for learning
    if (settings.learning.enabled) {
      const { error: outcomeError } = await supabase
        .from('ai_response_outcomes')
        .insert({
          user_id: authenticatedUserId,
          conversation_id,
          message_id,
          property_id: context?.property_id,
          contact_id,
          message_type: messageType,
          topic: detectedTopics[0] || 'general',
          contact_type: contactType,
          channel,
          platform,
          initial_confidence: adjustedConfidence,
          suggested_response: finalResponse,
          outcome: shouldAutoSend ? 'auto_sent' : 'pending',
          sensitive_topics_detected: detectedTopics.filter(t =>
            settings.always_review_topics.includes(t)
          ),
          actions_suggested: suggestedActions,
        });

      if (outcomeError) {
        console.error('Failed to log AI response outcome:', outcomeError);
        // Don't fail the request, but log for monitoring
      }
    }

    const result: AIResponderResponse = {
      response: finalResponse,
      confidence: baseConfidence,
      adjusted_confidence: adjustedConfidence,
      suggested_actions: suggestedActions,
      detected_topics: detectedTopics,
      should_auto_send: shouldAutoSend,
      requires_review_reason: requiresReviewReason,
      message_type: messageType,
      queued: !shouldAutoSend && !!queueId,
      queue_id: queueId,
      security_blocked: false,
      security_sanitized: securityScan.action === 'sanitized' || !outputFilter.safe,
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
