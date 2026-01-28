/**
 * Investor Scorer Edge Function
 *
 * Scores seller motivation based on conversation content and property factors.
 * Uses a point-based system specific to RE investing (foreclosure, inheritance, etc.)
 *
 * @see /moltbot-skills/doughy-investor-core/SKILL.md for scoring criteria
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface InvestorScorerRequest {
  deal_id?: string;
  contact_id: string;
  message?: string;
  property_address?: string;
  detected_factors?: string[];
}

interface MotivationFactor {
  factor: string;
  points: number;
  detected: boolean;
  reason?: string;
}

type MotivationLevel = 'hot' | 'warm' | 'cold' | 'not_motivated';
type NextAction = 'schedule_call' | 'send_offer_range' | 'add_to_nurture' | 'long_term_follow_up' | 'disqualify';

interface InvestorScorerResponse {
  score: number;
  motivation: MotivationLevel;
  factors: MotivationFactor[];
  pain_points: string[];
  objections: string[];
  next_steps: NextAction[];
  recommended_response_type: 'discovery' | 'detailed' | 'offer_range' | 'nurture' | 'pass';
}

// =============================================================================
// Scoring Rules
// =============================================================================

/**
 * Positive motivation factors - indicate seller wants/needs to sell
 */
const POSITIVE_FACTORS: Record<string, { points: number; keywords: string[]; reason: string }> = {
  foreclosure: {
    points: 25,
    keywords: ['foreclosure', 'pre-foreclosure', 'behind on payments', 'bank taking', 'auction', 'notice of default', 'nod'],
    reason: 'Property in foreclosure'
  },
  inherited: {
    points: 20,
    keywords: ['inherited', 'inheritance', 'estate', 'passed away', 'deceased', 'probate', 'executor', 'beneficiary'],
    reason: 'Recently inherited property'
  },
  divorce: {
    points: 20,
    keywords: ['divorce', 'divorced', 'separating', 'split', 'ex-wife', 'ex-husband', 'settlement'],
    reason: 'Divorce situation'
  },
  medical: {
    points: 20,
    keywords: ['medical', 'health', 'hospital', 'surgery', 'illness', 'sick', 'disability', 'nursing home', 'assisted living'],
    reason: 'Health-related urgency'
  },
  out_of_state: {
    points: 15,
    keywords: ['out of state', 'absentee', 'live far', 'moved away', 'different state', 'cant manage', 'too far'],
    reason: 'Absentee owner'
  },
  vacant: {
    points: 15,
    keywords: ['vacant', 'empty', 'not living there', 'nobody in', 'sitting empty', 'unoccupied'],
    reason: 'Property appears vacant'
  },
  tired_landlord: {
    points: 15,
    keywords: ['tired of', 'sick of tenants', 'bad tenants', 'problem tenants', 'eviction', 'landlord nightmare', 'done being landlord'],
    reason: 'Exhausted from property management'
  },
  job_relocation: {
    points: 15,
    keywords: ['relocating', 'job transfer', 'moving for work', 'new job', 'transferred', 'starting job'],
    reason: 'Moving for work'
  },
  quick_timeline: {
    points: 20,
    keywords: ['asap', 'quickly', 'fast', 'soon as possible', 'within 30 days', 'this month', 'urgent', 'need to sell now'],
    reason: 'Wants to sell fast'
  },
  code_violations: {
    points: 15,
    keywords: ['code violation', 'city fines', 'condemned', 'citation', 'compliance', 'violations'],
    reason: 'Property has code violations'
  },
  stale_listing: {
    points: 15,
    keywords: ['been listed', 'on market for', 'cant sell', 'no offers', 'expired listing', 'failed to sell'],
    reason: 'Previously listed without success'
  },
  repairs_needed: {
    points: 10,
    keywords: ['needs work', 'repairs', 'fixer', 'as-is', 'handyman', 'tlc needed', 'roof', 'foundation issues'],
    reason: 'Property needs significant repairs'
  },
  tax_issues: {
    points: 15,
    keywords: ['back taxes', 'tax lien', 'owe taxes', 'tax sale', 'property taxes'],
    reason: 'Tax delinquency'
  }
};

/**
 * Negative factors - indicate seller is not motivated or problematic
 */
const NEGATIVE_FACTORS: Record<string, { points: number; keywords: string[]; reason: string }> = {
  unrealistic_price: {
    points: -20,
    keywords: ['zillow says', 'worth at least', 'wont go below', 'retail value', 'full price', 'appraised at', 'not negotiable'],
    reason: 'Unrealistic price expectations'
  },
  just_testing: {
    points: -15,
    keywords: ['just curious', 'testing the market', 'maybe', 'might sell', 'thinking about', 'not sure if', 'exploring options'],
    reason: 'Just testing waters, no real motivation'
  },
  has_agent: {
    points: -10,
    keywords: ['my agent', 'realtor', 'listed with', 'have an agent', 'working with agent'],
    reason: 'Already has agent representation'
  },
  wants_to_stay: {
    points: -25,
    keywords: ['want to stay', 'live here', 'rent back', 'leaseback', 'not moving', 'keep living'],
    reason: 'Wants to remain in property'
  },
  recently_refinanced: {
    points: -20,
    keywords: ['just refinanced', 'new mortgage', 'recently refinanced', 'locked in rate'],
    reason: 'Recently refinanced - unlikely to have equity motivation'
  },
  sentimental: {
    points: -10,
    keywords: ['grew up here', 'family home', 'memories', 'hard to let go', 'sentimental'],
    reason: 'Emotional attachment to property'
  }
};

// =============================================================================
// Scoring Functions
// =============================================================================

function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function scoreConversation(
  messages: string[],
  preDetectedFactors?: string[]
): { score: number; factors: MotivationFactor[]; painPoints: string[]; objections: string[] } {
  const combinedText = messages.join(' ').toLowerCase();
  const factors: MotivationFactor[] = [];
  const painPoints: string[] = [];
  const objections: string[] = [];
  let score = 50; // Base score

  // Check for pre-detected factors (from property data)
  if (preDetectedFactors) {
    for (const factorKey of preDetectedFactors) {
      const rule = POSITIVE_FACTORS[factorKey];
      if (rule) {
        factors.push({
          factor: factorKey.replace(/_/g, ' '),
          points: rule.points,
          detected: true,
          reason: rule.reason
        });
        score += rule.points;
        painPoints.push(factorKey);
      }
    }
  }

  // Score positive factors from conversation
  for (const [key, rule] of Object.entries(POSITIVE_FACTORS)) {
    // Skip if already detected from pre-provided factors
    if (preDetectedFactors?.includes(key)) continue;

    const detected = containsKeywords(combinedText, rule.keywords);
    if (detected) {
      factors.push({
        factor: key.replace(/_/g, ' '),
        points: rule.points,
        detected: true,
        reason: rule.reason
      });
      score += rule.points;
      painPoints.push(key);
    }
  }

  // Score negative factors
  for (const [key, rule] of Object.entries(NEGATIVE_FACTORS)) {
    const detected = containsKeywords(combinedText, rule.keywords);
    if (detected) {
      factors.push({
        factor: key.replace(/_/g, ' '),
        points: rule.points,
        detected: true,
        reason: rule.reason
      });
      score += rule.points;
      objections.push(key);
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, factors: factors.filter(f => f.detected), painPoints, objections };
}

function getMotivationLevel(score: number): MotivationLevel {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'cold';
  return 'not_motivated';
}

function getNextSteps(motivation: MotivationLevel, hasObjctions: boolean): NextAction[] {
  switch (motivation) {
    case 'hot':
      return hasObjctions
        ? ['schedule_call', 'send_offer_range']
        : ['send_offer_range', 'schedule_call'];
    case 'warm':
      return ['schedule_call', 'add_to_nurture'];
    case 'cold':
      return ['add_to_nurture', 'long_term_follow_up'];
    case 'not_motivated':
      return ['long_term_follow_up', 'disqualify'];
  }
}

function getResponseType(motivation: MotivationLevel): InvestorScorerResponse['recommended_response_type'] {
  switch (motivation) {
    case 'hot': return 'offer_range';
    case 'warm': return 'detailed';
    case 'cold': return 'discovery';
    case 'not_motivated': return 'nurture';
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
    // Try new SUPABASE_SECRET_KEY first, fall back to legacy SUPABASE_SERVICE_ROLE_KEY
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify authentication
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

    const authenticatedUserId = user.id;

    // Parse request
    const body: InvestorScorerRequest = await req.json();
    const { deal_id, contact_id, message, detected_factors } = body;

    if (!contact_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing contact_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch conversation history if available
    const messageTexts: string[] = [];
    if (message) {
      messageTexts.push(message);
    }

    // Get messages from conversations with this contact
    const { data: conversations } = await supabase
      .from('rental_conversations')
      .select('id')
      .eq('contact_id', contact_id)
      .eq('user_id', authenticatedUserId);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { data: messages } = await supabase
        .from('rental_messages')
        .select('content, direction')
        .in('conversation_id', conversationIds)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(20);

      if (messages) {
        for (const msg of messages) {
          if (msg.content) {
            messageTexts.push(msg.content);
          }
        }
      }
    }

    // Score the conversation
    const { score, factors, painPoints, objections } = scoreConversation(
      messageTexts,
      detected_factors
    );

    const motivation = getMotivationLevel(score);
    const nextSteps = getNextSteps(motivation, objections.length > 0);
    const responseType = getResponseType(motivation);

    // Update deal if provided
    if (deal_id) {
      await supabase
        .from('investor_deals')
        .update({
          motivation_score: score,
          motivation: motivation,
          pain_points: painPoints,
          objections: objections,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal_id)
        .eq('user_id', authenticatedUserId);
    }

    // Update contact score
    await supabase
      .from('crm_contacts')
      .update({
        score: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact_id)
      .eq('user_id', authenticatedUserId);

    const result: InvestorScorerResponse = {
      score,
      motivation,
      factors,
      pain_points: painPoints,
      objections,
      next_steps: nextSteps,
      recommended_response_type: responseType
    };

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Investor scorer error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
