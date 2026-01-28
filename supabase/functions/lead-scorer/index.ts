/**
 * Lead Scorer Edge Function
 *
 * Scores leads based on their inquiry and conversation history.
 * Uses a point-based system to evaluate lead quality and recommend actions.
 *
 * @see /docs/doughy-architecture-refactor.md for scoring criteria
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface LeadScorerRequest {
  contact_id: string;
  conversation_id: string;
  message?: string; // Optional latest message to score
}

interface ScoreFactor {
  factor: string;
  points: number;
  detected: boolean;
}

interface LeadScorerResponse {
  score: number;
  factors: ScoreFactor[];
  recommendation: 'auto_qualify' | 'likely_qualify' | 'needs_review' | 'likely_decline' | 'auto_decline';
  suggested_response_type: 'detailed' | 'clarifying' | 'acknowledgment' | 'decline';
}

// =============================================================================
// Scoring Rules
// =============================================================================

const POSITIVE_KEYWORDS = {
  traveling_professional: {
    points: 20,
    keywords: ['travel nurse', 'traveling', 'contract', 'assignment', 'relocating for work', 'temporary assignment', 'travel healthcare']
  },
  healthcare_worker: {
    points: 15,
    keywords: ['nurse', 'rn', 'lpn', 'doctor', 'physician', 'therapist', 'tech', 'healthcare', 'medical', 'hospital', 'clinic']
  },
  mentions_employer: {
    points: 10,
    keywords: ['my employer', 'company', 'agency', 'staffing', 'aya', 'cross country', 'medical solutions', 'trustaff', 'fastaff']
  }
};

const NEGATIVE_KEYWORDS = {
  party_event: {
    points: -30,
    keywords: ['party', 'bachelor', 'bachelorette', 'event', 'gathering', 'celebration', 'wedding party']
  },
  cash_only: {
    points: -25,
    keywords: ['pay cash', 'cash only', 'no checks', 'no verification', 'off the books']
  },
  extra_guests: {
    points: -10,
    keywords: ['friends staying', 'visitors', 'extra people', 'girlfriend', 'boyfriend', 'partner staying']
  },
  sob_story: {
    points: -15,
    keywords: ['desperate', 'emergency', 'evicted', 'homeless', 'asap', 'urgent', 'today', 'tonight']
  }
};

const SOURCE_SCORES: Record<string, number> = {
  furnishedfinder: 10,
  airbnb: 5,
  turbotenant: 5,
  direct: 0,
  facebook: -5,
  craigslist: -10
};

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Check if text contains any keywords from a list
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Calculate score based on message content
 */
function scoreMessageContent(messages: string[]): { score: number; factors: ScoreFactor[] } {
  const combinedText = messages.join(' ').toLowerCase();
  const factors: ScoreFactor[] = [];
  let score = 50; // Base score

  // Positive factors
  for (const [name, rule] of Object.entries(POSITIVE_KEYWORDS)) {
    const detected = containsKeywords(combinedText, rule.keywords);
    factors.push({
      factor: name.replace(/_/g, ' '),
      points: detected ? rule.points : 0,
      detected
    });
    if (detected) score += rule.points;
  }

  // Negative factors
  for (const [name, rule] of Object.entries(NEGATIVE_KEYWORDS)) {
    const detected = containsKeywords(combinedText, rule.keywords);
    factors.push({
      factor: name.replace(/_/g, ' '),
      points: detected ? rule.points : 0,
      detected
    });
    if (detected) score += rule.points;
  }

  // Check for clear move-in date
  const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(combinedText) ||
                  /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(combinedText);
  factors.push({
    factor: 'clear move-in date',
    points: hasDate ? 15 : 0,
    detected: hasDate
  });
  if (hasDate) score += 15;

  // Check for medium-term stay mention
  const hasMediumTerm = /\b(30|60|90|3 month|6 month|three month|six month|semester|quarter)\b/i.test(combinedText);
  factors.push({
    factor: 'medium-term stay',
    points: hasMediumTerm ? 15 : 0,
    detected: hasMediumTerm
  });
  if (hasMediumTerm) score += 15;

  // Check for short stay (negative)
  const hasShortStay = /\b(1 week|2 week|one week|two week|few days|weekend|1 night|2 night)\b/i.test(combinedText);
  factors.push({
    factor: 'very short stay',
    points: hasShortStay ? -15 : 0,
    detected: hasShortStay
  });
  if (hasShortStay) score -= 15;

  return { score: Math.max(0, Math.min(100, score)), factors };
}

/**
 * Score based on contact source
 */
function scoreSource(source: string | null): { score: number; factor: ScoreFactor } {
  const points = SOURCE_SCORES[source || 'direct'] || 0;
  return {
    score: points,
    factor: {
      factor: `source: ${source || 'unknown'}`,
      points,
      detected: true
    }
  };
}

/**
 * Determine recommendation based on score
 */
function getRecommendation(score: number): {
  recommendation: LeadScorerResponse['recommendation'];
  suggested_response_type: LeadScorerResponse['suggested_response_type'];
} {
  if (score >= 80) {
    return { recommendation: 'auto_qualify', suggested_response_type: 'detailed' };
  } else if (score >= 60) {
    return { recommendation: 'likely_qualify', suggested_response_type: 'clarifying' };
  } else if (score >= 40) {
    return { recommendation: 'needs_review', suggested_response_type: 'acknowledgment' };
  } else if (score >= 20) {
    return { recommendation: 'likely_decline', suggested_response_type: 'decline' };
  } else {
    return { recommendation: 'auto_decline', suggested_response_type: 'decline' };
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
    const body: LeadScorerRequest = await req.json();
    const { contact_id, conversation_id, message } = body;

    // Validate required fields
    if (!contact_id || !conversation_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing contact_id or conversation_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, email, source, contact_types, score, metadata')
      .eq('id', contact_id)
      .single();

    if (contactError) {
      console.error('Error fetching contact:', contactError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Contact not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('rental_messages')
      .select('content, direction, sent_by')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Collect all message content for scoring
    const messageTexts: string[] = [];
    if (message) {
      messageTexts.push(message);
    }
    if (messages) {
      for (const msg of messages) {
        if (msg.direction === 'inbound' && msg.content) {
          messageTexts.push(msg.content);
        }
      }
    }

    // Score the lead
    const allFactors: ScoreFactor[] = [];
    let totalScore = 0;

    // Score message content
    if (messageTexts.length > 0) {
      const contentScore = scoreMessageContent(messageTexts);
      totalScore = contentScore.score;
      allFactors.push(...contentScore.factors.filter(f => f.detected));
    } else {
      totalScore = 50; // Base score if no messages
    }

    // Score source
    const sourceScore = scoreSource(contact.source);
    totalScore += sourceScore.score;
    if (sourceScore.score !== 0) {
      allFactors.push(sourceScore.factor);
    }

    // Check for professional email domain
    const email = contact.email || '';
    const isProEmail = email && !/@(gmail|yahoo|hotmail|outlook|aol|icloud)\./i.test(email);
    if (isProEmail) {
      allFactors.push({
        factor: 'professional email domain',
        points: 5,
        detected: true
      });
      totalScore += 5;
    }

    // Check for repeat guest
    if (contact.score && contact.score > 70) {
      allFactors.push({
        factor: 'repeat guest with good history',
        points: 10,
        detected: true
      });
      totalScore += 10;
    }

    // Clamp score
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Get recommendation
    const { recommendation, suggested_response_type } = getRecommendation(totalScore);

    // Update contact score in database
    await supabase
      .from('crm_contacts')
      .update({
        score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact_id);

    const result: LeadScorerResponse = {
      score: totalScore,
      factors: allFactors,
      recommendation,
      suggested_response_type
    };

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Lead scorer error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
