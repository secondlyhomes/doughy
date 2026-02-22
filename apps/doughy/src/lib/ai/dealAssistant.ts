// src/lib/ai/dealAssistant.ts
// Enhanced AI service for deal-aware assistant with optimized prompts

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from '../supabase';
import { AssistantContextSnapshot } from '@/features/assistant/types/context';
import { getCachedResponse, cacheResponse } from './cache';
import { aiRateLimiter } from './rateLimiter';
import { handleAIError } from './errors';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  suggestedActions?: string[];
  confidence?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

/**
 * Check if we should use mock mode
 * True if: USE_MOCK_DATA flag is set OR no API configured OR in Jest test environment
 */
function isMockMode(): boolean {
  // In Jest tests, use mock mode (process.env.JEST_WORKER_ID is set by Jest)
  const isJestTest = typeof process.env.JEST_WORKER_ID !== 'undefined';

  return (
    USE_MOCK_DATA ||
    isJestTest ||
    !SUPABASE_URL ||
    SUPABASE_URL.includes('localhost')
  );
}

// ============================================
// Context Compression & Optimization
// ============================================

/**
 * Compress context to essential information for token efficiency
 */
function compressContext(context: AssistantContextSnapshot): string {
  const parts: string[] = [];

  // Screen context
  parts.push(`Screen: ${context.screen.name}`);

  // Deal-specific context
  if (context.payload.type === 'deal_cockpit') {
    const payload = context.payload;
    parts.push(`Deal Stage: ${payload.deal.stage}`);

    if (payload.deal.nextAction) {
      parts.push(`Next Action: ${payload.deal.nextAction.label}`);
      if (payload.deal.nextAction.isOverdue) {
        parts.push('⚠️ Action is OVERDUE');
      }
    }

    // Numbers (if available)
    if (payload.deal.numbers.mao) {
      parts.push(`MAO: $${payload.deal.numbers.mao.value.toLocaleString()} (${payload.deal.numbers.mao.confidence} confidence)`);
    }
    if (payload.deal.numbers.profit) {
      parts.push(`Profit: $${payload.deal.numbers.profit.value.toLocaleString()}`);
    }
    if (payload.deal.numbers.risk) {
      parts.push(`Risk: ${payload.deal.numbers.risk.value}/5 (${payload.deal.numbers.risk.band})`);
    }

    // Missing info (critical for recommendations)
    if (payload.missingInfo.length > 0) {
      const highPriority = payload.missingInfo.filter(i => i.severity === 'high');
      if (highPriority.length > 0) {
        parts.push(`Missing (HIGH): ${highPriority.map(i => i.label).join(', ')}`);
      }
    }

    // Recent activity
    if (payload.recentEvents.length > 0) {
      parts.push(`Recent: ${payload.recentEvents[0].title}`);
    }
  }

  // Property context
  if (context.payload.type === 'property_detail') {
    const payload = context.payload;
    parts.push(`Property: ${payload.property.address}`);
    if (payload.analysisMetrics?.mao) {
      parts.push(`MAO: $${payload.analysisMetrics.mao.toLocaleString()}`);
    }
  }

  // Focus mode
  if (context.focusMode) {
    parts.push('Focus Mode: ON');
  }

  return parts.join(' | ');
}

/**
 * Build optimized system prompt for deal assistant
 */
function buildSystemPrompt(context: AssistantContextSnapshot): string {
  return `You are an AI assistant for a real estate deal management platform.

CONTEXT:
${compressContext(context)}

YOUR ROLE:
- Help the user make data-driven decisions about their real estate deals
- Provide concise, actionable advice
- Identify missing information that could affect decisions
- Suggest next steps based on deal stage and context
- Be conversational but professional

CONSTRAINTS:
- Keep responses under 150 words unless asked for detail
- Focus on the most relevant 1-2 points
- Use bullet points for lists
- Include specific numbers when available
- Don't make up data - say "I don't have that information" if needed

CAPABILITIES:
- Analyze deal metrics (MAO, profit, risk, cash flow)
- Recommend next actions based on stage
- Identify missing critical information
- Draft communication (emails, texts, offers)
- Explain calculations and assumptions
- Compare scenarios

USER PLAN: ${context.user.plan}
PERMISSIONS: ${context.permissions.canWrite ? 'Read/Write' : 'Read-only'}`;
}

/**
 * Extract suggested actions from AI response
 */
function extractSuggestedActions(response: string): string[] {
  const actions: string[] = [];

  // Look for action-oriented phrases
  const actionPatterns = [
    /(?:you (?:should|could|might want to))[\s]+([^.!?]+)/gi,
    /(?:I (?:suggest|recommend))[\s]+([^.!?]+)/gi,
    /(?:next step:?)[\s]+([^.!?]+)/gi,
    /(?:action:?)[\s]+([^.!?]+)/gi,
  ];

  for (const pattern of actionPatterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        actions.push(match[1].trim());
      }
    }
  }

  return actions.slice(0, 3); // Limit to top 3 suggestions
}

/**
 * Determine response confidence based on context completeness
 */
function assessConfidence(context: AssistantContextSnapshot): 'high' | 'medium' | 'low' {
  if (context.payload.type === 'deal_cockpit') {
    const missingHigh = context.payload.missingInfo.filter(i => i.severity === 'high');
    if (missingHigh.length >= 3) return 'low';
    if (missingHigh.length >= 1) return 'medium';
    return 'high';
  }

  return 'medium';
}

// ============================================
// Mock Responses (Development)
// ============================================

const MOCK_RESPONSES: Record<string, string> = {
  analyze: "Based on your numbers, this deal has solid potential. Your MAO looks conservative at 70% of ARV, giving good margin for unexpected costs. The main concern is the missing repair estimate - that's critical for accurate profit calculation. I'd suggest getting a contractor walkthrough soon.",

  missing: "I notice you're missing the ARV estimate. This is essential for calculating your maximum allowable offer. I can help you find comparable properties in the area to estimate ARV. Would you like me to do that?",

  next: "Since you're in the Analyzing stage with a strong profit margin, your next step should be preparing the offer. I recommend using the Seller Report to present multiple options to the seller - this builds trust and often leads to better terms.",

  risk: "Your risk score of 3/5 is moderate. The main risks are: 1) No repair estimate yet, 2) Limited comps data. To reduce risk, get a contractor estimate and verify ARV with recent sales. Want me to help with either of these?",

  default: "I can help you with this deal! What specific aspect would you like to focus on - the numbers, next steps, or missing information?",
};

function getMockDealResponse(message: string, context: AssistantContextSnapshot): AIResponse {
  const lowerMessage = message.toLowerCase();

  let content = MOCK_RESPONSES.default;

  if (lowerMessage.includes('analyz') || lowerMessage.includes('look') || lowerMessage.includes('think')) {
    content = MOCK_RESPONSES.analyze;
  } else if (lowerMessage.includes('miss') || lowerMessage.includes('need')) {
    content = MOCK_RESPONSES.missing;
  } else if (lowerMessage.includes('next') || lowerMessage.includes('should') || lowerMessage.includes('do')) {
    content = MOCK_RESPONSES.next;
  } else if (lowerMessage.includes('risk')) {
    content = MOCK_RESPONSES.risk;
  }

  return {
    content,
    suggestedActions: extractSuggestedActions(content),
    confidence: assessConfidence(context),
  };
}

// ============================================
// API Integration
// ============================================

/**
 * Call OpenAI for deal assistant with structured context
 */
export async function callDealAssistant(
  message: string,
  context: AssistantContextSnapshot,
  conversationHistory: AIMessage[] = []
): Promise<AIResponse> {
  const userId = context.user.id || 'anonymous';

  // Check rate limit (before cache to prevent cache bypass)
  if (!aiRateLimiter.canMakeRequest(userId)) {
    const remaining = aiRateLimiter.getRemainingRequests(userId);
    const resetTime = Math.ceil(aiRateLimiter.getTimeUntilReset(userId) / 1000);

    return {
      content: `You're making requests too quickly. Please wait ${resetTime} seconds before trying again.`,
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        rateLimited: true,
        remainingRequests: remaining,
        resetInSeconds: resetTime,
      },
    };
  }

  // Record this request
  aiRateLimiter.recordRequest(userId);

  // Check cache first (only for messages without conversation history)
  if (conversationHistory.length === 0) {
    const cached = await getCachedResponse(message, context);
    if (cached) {
      console.log('[DealAssistant] Cache hit');
      return {
        content: cached,
        suggestedActions: extractSuggestedActions(cached),
        confidence: assessConfidence(context),
      };
    }
  }

  // Mock mode for development/testing
  if (isMockMode()) {
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
    const response = getMockDealResponse(message, context);

    // Cache the mock response
    if (conversationHistory.length === 0) {
      await cacheResponse(message, response.content, context);
    }

    return response;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai/chat`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    // Build messages with system prompt and history
    const messages: AIMessage[] = [
      { role: 'system', content: buildSystemPrompt(context) },
      ...conversationHistory.filter(m => m.role !== 'system'),
      { role: 'user', content: message },
    ];

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model: 'gpt-4o-mini', // Fast and cost-effective
        temperature: 0.7,
        max_tokens: 300, // Keep responses concise
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content || data.pure_text || "I couldn't process that request.";

    // Cache successful responses (only for simple queries)
    if (conversationHistory.length === 0) {
      await cacheResponse(message, content, context);
    }

    return {
      content,
      suggestedActions: extractSuggestedActions(content),
      confidence: assessConfidence(context),
    };
  } catch (error) {
    console.error('[DealAssistant] Error:', error);
    return handleAIError(error);
  }
}

/**
 * Generate action recommendation using AI
 */
export async function generateActionRecommendation(
  context: AssistantContextSnapshot
): Promise<{
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}> {
  if (isMockMode()) {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (context.payload.type === 'deal_cockpit') {
      const hasHighMissing = context.payload.missingInfo.some(i => i.severity === 'high');

      if (hasHighMissing) {
        return {
          action: 'Complete underwriting analysis',
          rationale: 'Missing critical data needed for accurate offer calculation',
          priority: 'high',
        };
      }

      if (context.payload.deal.nextAction?.isOverdue) {
        return {
          action: context.payload.deal.nextAction.label,
          rationale: 'This action is overdue and blocking deal progress',
          priority: 'high',
        };
      }
    }

    return {
      action: 'Review and update deal status',
      rationale: 'Keep momentum by taking the next logical step',
      priority: 'medium',
    };
  }

  // Call AI for recommendation
  const prompt = `Based on the current deal state, what's the single most important action to take next? Be specific and concise.`;
  const response = await callDealAssistant(prompt, context);

  return {
    action: response.suggestedActions?.[0] || 'Continue deal analysis',
    rationale: response.content,
    priority: response.confidence === 'high' ? 'high' : 'medium',
  };
}

/**
 * Draft communication text using AI
 */
export async function draftCommunication(
  type: 'email' | 'sms' | 'offer_text',
  context: AssistantContextSnapshot,
  customInstructions?: string
): Promise<string> {
  const typePrompts = {
    email: 'Draft a professional follow-up email to the seller',
    sms: 'Draft a brief, friendly text message to the seller',
    offer_text: 'Draft clear offer presentation text for the seller',
  };

  const prompt = `${typePrompts[type]}${customInstructions ? `: ${customInstructions}` : ''}`;

  if (isMockMode()) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockDrafts = {
      email: `Subject: Following Up on [Property Address]

Hi [Seller Name],

I wanted to follow up on our conversation about your property. Based on my analysis, I can offer flexible options that might work well for your situation.

I've prepared a detailed report showing three different scenarios. Would you have 15 minutes this week to discuss which approach makes the most sense for you?

Looking forward to hearing from you.

Best regards,
[Your Name]`,

      sms: `Hi [Seller Name], this is [Your Name]. I've finished analyzing your property and have put together some options I think you'll find interesting. When's a good time for a quick call this week?`,

      offer_text: `Based on my analysis of comparable properties and current market conditions, I can offer the following options for your property:

Option 1: All Cash - Close in 14 days
Option 2: Seller Finance - Higher price, flexible terms
Option 3: Subject-To - Take over payments, no closing costs

Each option has different advantages. Let's discuss which works best for your timeline and goals.`,
    };

    return mockDrafts[type];
  }

  const response = await callDealAssistant(prompt, context);
  return response.content;
}

export default {
  callDealAssistant,
  generateActionRecommendation,
  draftCommunication,
};
