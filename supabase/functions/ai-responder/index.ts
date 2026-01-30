/**
 * AI Responder Edge Function
 *
 * Generates AI responses for guest/lead messages with confidence scores.
 * Uses OpenAI to generate contextually appropriate responses based on
 * contact history, property details, and conversation context.
 *
 * Features:
 * - User-specific AI mode and confidence thresholds
 * - Adaptive learning from past review outcomes
 * - Contact-type-specific behavior (leads vs tenants)
 * - Topic detection for sensitive content
 * - Security scanning for prompt injection and data exfiltration
 * - Memory system integration for personalized responses
 * - AI Firewall integration with circuit breaker and threat tracking
 *
 * @module ai-responder
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleCors, addCorsHeaders } from "../_shared/cors.ts";
import {
  filterOutput,
  buildSecureSystemPrompt,
  type SecurityScanResult,
} from "../_shared/security.ts";
import {
  withAIFirewall,
  type AISecurityContext,
} from "../_shared/ai-security/index.ts";
import {
  detectTopics,
  classifyMessageType,
  determineSuggestedActions,
  calculateBaseConfidence,
  applySecurityAdjustment,
  generateChatCompletion,
} from "../_shared/ai/index.ts";

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

// =============================================================================
// Constants
// =============================================================================

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
// Memory Functions
// =============================================================================

async function loadMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  propertyId?: string,
  channel?: string,
  contactType?: string,
  contactId?: string
): Promise<MemoryContext> {
  try {
    const { data: memoryContext } = await supabase.rpc('get_user_memory_context', {
      p_user_id: userId,
      p_property_id: propertyId || null,
      p_channel: channel || null,
      p_contact_type: contactType || null,
    });

    let contactMemories: MemoryContext['contact_memories'] = [];
    if (contactId) {
      const { data: episodic } = await supabase.rpc('get_contact_episodic_memories', {
        p_user_id: userId,
        p_contact_id: contactId,
        p_limit: 5,
      });
      if (episodic) contactMemories = episodic;
    }

    return { user_memories: memoryContext || {}, contact_memories: contactMemories };
  } catch (error) {
    console.error('Failed to load memory context:', error);
    return {};
  }
}

function buildMemoryPromptSection(memoryContext: MemoryContext): string {
  const sections: string[] = [];

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

  if (memoryContext.user_memories?.property_rules && Array.isArray(memoryContext.user_memories.property_rules)) {
    const rules = memoryContext.user_memories.property_rules;
    if (rules.length > 0) {
      sections.push('PROPERTY-SPECIFIC RULES:\n' + rules.map(r => `- ${JSON.stringify(r)}`).join('\n'));
    }
  }

  if (memoryContext.contact_memories && memoryContext.contact_memories.length > 0) {
    const historyLines = memoryContext.contact_memories.map(m => {
      let line = `- ${m.summary}`;
      if (m.sentiment && m.sentiment !== 'neutral') line += ` (${m.sentiment} interaction)`;
      return line;
    });
    sections.push('PAST INTERACTIONS WITH THIS CONTACT:\n' + historyLines.join('\n'));
  }

  return sections.length > 0 ? '\n\n' + sections.join('\n\n') : '';
}

// =============================================================================
// Prompt Building
// =============================================================================

function buildSystemPrompt(context: {
  property?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  ownerName: string;
  conversationHistory: Message[];
  settings: LandlordSettings;
  contactType: string;
  memoryContext?: MemoryContext;
}): string {
  const { settings, contactType, memoryContext } = context;

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

  const greeting = settings.ai_personality.greeting_style
    .replace('{first_name}', (context.contact?.first_name as string) || 'there')
    .replace('{name}', (context.contact?.first_name as string) || (context.contact?.last_name as string) || 'there');

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
    const p = context.property;
    prompt += `\n\nPROPERTY DETAILS:
- Name: ${p.name}
- Address: ${p.address}, ${p.city}, ${p.state}
- Bedrooms: ${p.bedrooms}
- Bathrooms: ${p.bathrooms}
- Base Rate: $${p.base_rate}/${p.rate_type}
- Amenities: ${Array.isArray(p.amenities) ? p.amenities.join(', ') : 'Standard furnished amenities'}
${p.house_rules ? `- House Rules: ${JSON.stringify(p.house_rules)}` : ''}
`;
  }

  if (context.contact) {
    const c = context.contact;
    const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown';
    prompt += `\n\nCONTACT INFO:
- Name: ${name}
- Type: ${contactType}
- Source: ${c.source || 'Unknown'}
${(c.metadata as Record<string, unknown>)?.profession ? `- Profession: ${(c.metadata as Record<string, unknown>).profession}` : ''}
`;
  }

  if (context.conversationHistory.length > 0) {
    prompt += '\n\nRECENT CONVERSATION HISTORY:\n';
    context.conversationHistory.slice(-10).forEach((msg) => {
      const sender = msg.sent_by === 'contact' ? 'Guest' : 'You';
      prompt += `${sender}: ${msg.content}\n`;
    });
  }

  if (memoryContext) {
    prompt += buildMemoryPromptSection(memoryContext);
  }

  return buildSecureSystemPrompt(prompt);
}

// =============================================================================
// Auto-Send Decision
// =============================================================================

function determineAutoSend(params: {
  adjustedConfidence: number;
  settings: LandlordSettings;
  detectedTopics: string[];
  contactType: string;
  suggestedActions: string[];
  securityAction: string;
}): { shouldAutoSend: boolean; reason?: string } {
  const { adjustedConfidence, settings, detectedTopics, contactType, suggestedActions, securityAction } = params;

  const hasAlwaysReviewTopic = detectedTopics.some(t => settings.always_review_topics.includes(t));

  if (hasAlwaysReviewTopic) {
    return { shouldAutoSend: false, reason: `Contains sensitive topic: ${detectedTopics.find(t => settings.always_review_topics.includes(t))}` };
  }

  if (!settings.ai_auto_respond) {
    return { shouldAutoSend: false, reason: 'Auto-respond is disabled' };
  }

  if (settings.ai_mode === 'training') {
    return adjustedConfidence >= 0.95
      ? { shouldAutoSend: true }
      : { shouldAutoSend: false, reason: 'Training mode - building your preferences' };
  }

  if (settings.ai_mode === 'autonomous') {
    return adjustedConfidence >= 0.50 && !hasAlwaysReviewTopic
      ? { shouldAutoSend: true }
      : { shouldAutoSend: false, reason: 'Confidence below autonomous threshold' };
  }

  // Assisted mode
  const threshold = contactType === 'lead' && settings.lead_settings.fast_response_enabled
    ? Math.min(settings.confidence_threshold, settings.lead_settings.lead_confidence_threshold) / 100
    : settings.confidence_threshold / 100;

  if (adjustedConfidence < threshold) {
    return { shouldAutoSend: false, reason: `Confidence ${Math.round(adjustedConfidence * 100)}% below threshold ${Math.round(threshold * 100)}%` };
  }

  if (suggestedActions.includes('log_maintenance_request')) {
    return { shouldAutoSend: false, reason: 'Maintenance request requires review' };
  }

  if (securityAction === 'flagged' || securityAction === 'sanitized') {
    return { shouldAutoSend: false, reason: 'Security review recommended' };
  }

  return { shouldAutoSend: true };
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * AI Responder handler wrapped with AI Security Firewall
 *
 * The firewall handles:
 * - Circuit breaker checks
 * - Rate limiting
 * - Input security scanning
 * - Threat score tracking
 * - Database pattern matching
 */
serve(withAIFirewall({
  functionName: 'ai-responder',
  inputField: 'message',
  functionHourlyLimit: 100,
  globalHourlyLimit: 200,
  burstLimit: 20,
}, async (req: Request, ctx: AISecurityContext) => {
  const supabase = ctx.supabase as SupabaseClient;

  // Authentication is handled by firewall, but we need user for this function
  if (!ctx.userId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authenticatedUserId = ctx.userId;

  // Parse request from firewall context (already parsed and sanitized)
  const body = ctx.body as AIResponderRequest;
  const { contact_id, conversation_id, message_id, channel, platform, context } = body;

  if (!contact_id) {
    return new Response(JSON.stringify({ error: 'Missing contact_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use sanitized input from firewall
  const processedMessage = ctx.sanitizedInput;
  const securityScan = ctx.securityScan;

  // If security blocked, return safe response
  if (securityScan.action === 'blocked') {
    return new Response(JSON.stringify({
      response: "I can only help with property management questions. How can I assist you today?",
      confidence: 1.0,
      adjusted_confidence: 1.0,
      suggested_actions: [],
      detected_topics: [],
      should_auto_send: false,
      requires_review_reason: 'Security review required',
      message_type: 'blocked',
      security_blocked: true,
    } as AIResponderResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Load settings
  let settings: LandlordSettings = DEFAULT_SETTINGS;
  const { data: platformSettings } = await supabase
    .from('user_platform_settings')
    .select('landlord_settings')
    .eq('user_id', authenticatedUserId)
    .single();

  if (platformSettings?.landlord_settings) {
    settings = { ...DEFAULT_SETTINGS, ...platformSettings.landlord_settings };
  }

  // Fetch contact and property
  const { data: contact } = await supabase.from('crm_contacts').select('*').eq('id', contact_id).single();
  const contactTypes = contact?.contact_types || [];
  const contactType = contactTypes.includes('tenant') ? 'tenant' : contactTypes.includes('guest') ? 'guest' : 'lead';

  let property = null;
  if (context?.property_id) {
    const { data } = await supabase.from('rental_properties').select('*').eq('id', context.property_id).single();
    property = data;
  }

  // Get owner name
  const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('user_id', authenticatedUserId).single();
  const ownerName = settings.ai_personality.owner_name || profile?.full_name || 'Your Host';

  // Load memory context
  const memoryContext = await loadMemoryContext(supabase, authenticatedUserId, context?.property_id, channel, contactType, contact_id);

  // Detect topics and classify
  const detectedTopics = detectTopics(processedMessage);
  const messageType = classifyMessageType(processedMessage, detectedTopics);
  const conversationHistory = context?.conversation_history || [];

  // Build prompt and generate response
  const systemPrompt = buildSystemPrompt({ property, contact, ownerName, conversationHistory, settings, contactType, memoryContext });
  const generatedResponse = await generateChatCompletion(systemPrompt, processedMessage);

  // Filter output
  const outputFilter = filterOutput(generatedResponse);
  const finalResponse = outputFilter.filtered;

  // Calculate confidence
  const baseConfidence = calculateBaseConfidence({
    message: processedMessage,
    response: finalResponse,
    topics: detectedTopics,
    messageType,
    context: { property_id: context?.property_id, conversation_history: conversationHistory },
  });

  let adjustedConfidence = baseConfidence;

  // Apply learning adjustment
  if (settings.learning.enabled) {
    const { data: adjustedValue } = await supabase.rpc('calculate_adaptive_confidence', {
      p_user_id: authenticatedUserId,
      p_message_type: messageType,
      p_topic: detectedTopics[0] || 'general',
      p_contact_type: contactType,
      p_base_confidence: baseConfidence,
    });
    if (adjustedValue !== null) adjustedConfidence = adjustedValue;
  }

  // Apply security adjustment
  adjustedConfidence = applySecurityAdjustment(adjustedConfidence, securityScan.action);

  // Determine actions and auto-send
  const suggestedActions = determineSuggestedActions(processedMessage, detectedTopics);
  const { shouldAutoSend, reason: requiresReviewReason } = determineAutoSend({
    adjustedConfidence,
    settings,
    detectedTopics,
    contactType,
    suggestedActions,
    securityAction: securityScan.action,
  });

  // Queue if not auto-sending
  let queueId: string | undefined;
  if (!shouldAutoSend && conversation_id) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: queueItem } = await supabase
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

    if (queueItem) queueId = queueItem.id;
  }

  // Log outcome for learning
  if (settings.learning.enabled) {
    await supabase.from('ai_response_outcomes').insert({
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
      sensitive_topics_detected: detectedTopics.filter(t => settings.always_review_topics.includes(t)),
      actions_suggested: suggestedActions,
    });
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

  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
}));
