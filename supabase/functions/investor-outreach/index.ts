/**
 * Investor Outreach Edge Function
 *
 * Generates personalized outreach messages for sellers and agents.
 * Uses templates, AI generation, and contact context to create
 * relevant, personalized communication.
 *
 * @see /moltbot-skills/doughy-investor-core/SKILL.md for templates
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";
import { scanForThreats, buildSecureSystemPrompt, sanitizeForLogging } from "../_shared/security.ts";

// =============================================================================
// Types
// =============================================================================

type ContactType = 'seller' | 'agent';
type OutreachType = 'initial' | 'followup' | 'offer' | 'check_in';
type Channel = 'email' | 'sms';

interface InvestorOutreachRequest {
  contact_id: string;
  deal_id?: string;
  agent_id?: string;
  contact_type: ContactType;
  outreach_type: OutreachType;
  channel: Channel;
  sequence_position?: number;
  context?: {
    property_address?: string;
    property_info?: Record<string, unknown>;
    last_conversation_topic?: string;
    pain_points?: string[];
    motivation_score?: number;
  };
  template_id?: string; // Use specific template
}

interface GeneratedMessage {
  subject?: string;
  body: string;
  template_used?: string;
  personalization_applied: string[];
  confidence: number;
}

interface InvestorOutreachResponse {
  success: boolean;
  message?: GeneratedMessage;
  error?: string;
}

// =============================================================================
// Template Processing
// =============================================================================

interface TemplateVariables {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  property_address?: string;
  owner_name?: string;
  company_name?: string;
  agent_name?: string;
  market_area?: string;
  [key: string]: string | undefined;
}

function fillTemplate(
  template: string,
  variables: TemplateVariables
): { filled: string; used: string[] } {
  const used: string[] = [];
  let filled = template;

  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      if (pattern.test(filled)) {
        filled = filled.replace(pattern, value);
        used.push(key);
      }
    }
  }

  return { filled, used };
}

async function getTemplate(
  supabase: SupabaseClient,
  userId: string,
  contactType: ContactType,
  outreachType: OutreachType,
  channel: Channel,
  templateId?: string
): Promise<{ subject?: string; body: string; name: string } | null> {
  // Map outreach type to template category
  const categoryMap: Record<string, string> = {
    'seller_initial': 'seller_initial',
    'seller_followup': 'seller_followup',
    'seller_offer': 'seller_offer',
    'seller_check_in': 'seller_followup',
    'agent_initial': 'agent_intro',
    'agent_followup': 'agent_followup',
    'agent_offer': 'agent_followup',
    'agent_check_in': 'agent_followup',
  };

  const category = categoryMap[`${contactType}_${outreachType}`] || `${contactType}_${outreachType}`;

  let query = supabase
    .schema('investor')
    .from('outreach_templates')
    .select('id, name, subject, body')
    .eq('contact_type', contactType)
    .eq('channel', channel)
    .eq('is_active', true);

  if (templateId) {
    query = query.eq('id', templateId);
  } else {
    query = query.eq('category', category);
  }

  // Prefer user templates, fall back to system
  query = query.or(`user_id.eq.${userId},user_id.is.null`)
    .order('user_id', { ascending: false, nullsFirst: false })
    .limit(1);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  return {
    subject: data[0].subject,
    body: data[0].body,
    name: data[0].name
  };
}

// =============================================================================
// AI Generation (for custom/complex messages)
// =============================================================================

/**
 * Sanitize user-provided context fields to prevent prompt injection
 */
function sanitizeContextField(text: string | undefined): string | undefined {
  if (!text) return text;
  const scan = scanForThreats(text);
  if (scan.action === 'blocked') {
    console.warn('[investor-outreach] Blocked context field:', sanitizeForLogging(text));
    return undefined; // Remove blocked content entirely
  }
  return scan.sanitized;
}

async function generateAIMessage(
  context: {
    contactType: ContactType;
    outreachType: OutreachType;
    contactName: string;
    propertyAddress?: string;
    ownerName: string;
    companyName?: string;
    painPoints?: string[];
    lastTopic?: string;
    channel: Channel;
  }
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Sanitize user-provided context fields to prevent prompt injection
  const sanitizedPainPoints = context.painPoints
    ?.map(p => sanitizeContextField(p))
    .filter((p): p is string => p !== undefined);
  const sanitizedLastTopic = sanitizeContextField(context.lastTopic);

  const baseSystemPrompt = context.contactType === 'seller'
    ? `You are a real estate investor writing personalized outreach to motivated sellers.
Your tone should be:
- Empathetic and understanding of their situation
- Focused on solving their problem, not just buying their property
- Professional but warm
- Not pushy or aggressive

Keep messages concise and end with a clear call to action.
${context.channel === 'sms' ? 'This is for SMS - keep under 160 characters if possible, max 320.' : ''}`
    : `You are a real estate investor reaching out to build relationships with agents.
Your tone should be:
- Professional and business-focused
- Highlighting mutual benefits (referral fees, quick closes)
- Respectful of their time
- Building long-term relationship, not just asking for deals

Keep messages concise and end with a clear call to action.`;

  // Wrap with security rules to prevent prompt injection
  const systemPrompt = buildSecureSystemPrompt(baseSystemPrompt);

  const userPrompt = `Write a ${context.outreachType} ${context.channel} message.

Contact: ${context.contactName}
${context.propertyAddress ? `Property: ${context.propertyAddress}` : ''}
Sender: ${context.ownerName}${context.companyName ? `, ${context.companyName}` : ''}
${sanitizedPainPoints?.length ? `Known pain points: ${sanitizedPainPoints.join(', ')}` : ''}
${sanitizedLastTopic ? `Last conversation was about: ${sanitizedLastTopic}` : ''}

Generate just the message body (no subject line needed).`;

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
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: context.channel === 'sms' ? 100 : 300
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate AI message');
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
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
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const authenticatedUserId = user.id;

    // Parse request
    const body: InvestorOutreachRequest = await req.json();
    const { contact_id, deal_id, agent_id, contact_type, outreach_type, channel, context, template_id } = body;

    if (!contact_id || !contact_type || !outreach_type || !channel) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .schema('crm')
      .from('contacts')
      .select('first_name, last_name, email, phone')
      .eq('id', contact_id)
      .eq('user_id', authenticatedUserId)
      .single();

    if (contactError || !contact) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Contact not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Fetch user profile for owner name and company
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, business_name')
      .eq('user_id', authenticatedUserId)
      .single();

    const ownerName = profile?.full_name || 'Your Name';
    const companyName = profile?.business_name || '';

    // Get property address from deal if available
    let propertyAddress = context?.property_address;
    if (!propertyAddress && deal_id) {
      const { data: deal } = await supabase
        .schema('investor')
        .from('deals')
        .select('property_address, property_city, property_state')
        .eq('id', deal_id)
        .eq('user_id', authenticatedUserId)
        .single();

      if (deal) {
        propertyAddress = deal.property_address;
        if (deal.property_city) {
          propertyAddress += `, ${deal.property_city}`;
        }
      }
    }

    // Get agent name if agent outreach
    let agentName = '';
    if (contact_type === 'agent' && agent_id) {
      const { data: agent } = await supabase
        .schema('investor')
        .from('agents')
        .select('name')
        .eq('id', agent_id)
        .eq('user_id', authenticatedUserId)
        .single();

      if (agent) {
        agentName = agent.name;
      }
    }

    // Build template variables
    const variables: TemplateVariables = {
      first_name: contact.first_name || 'there',
      last_name: contact.last_name || '',
      full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'there',
      property_address: propertyAddress,
      owner_name: ownerName,
      company_name: companyName,
      agent_name: agentName || contact.first_name || 'there',
      market_area: context?.property_info?.city as string || 'the area',
    };

    // Try to get a template
    const template = await getTemplate(
      supabase,
      authenticatedUserId,
      contact_type,
      outreach_type,
      channel,
      template_id
    );

    let generatedMessage: GeneratedMessage;

    if (template) {
      // Fill template with variables
      const subjectResult = template.subject
        ? fillTemplate(template.subject, variables)
        : undefined;
      const bodyResult = fillTemplate(template.body, variables);

      generatedMessage = {
        subject: subjectResult?.filled,
        body: bodyResult.filled,
        template_used: template.name,
        personalization_applied: [...new Set([...(subjectResult?.used || []), ...bodyResult.used])],
        confidence: 0.85
      };
    } else {
      // Generate with AI
      const aiBody = await generateAIMessage({
        contactType: contact_type,
        outreachType: outreach_type,
        contactName: variables.full_name || 'there',
        propertyAddress,
        ownerName,
        companyName,
        painPoints: context?.pain_points,
        lastTopic: context?.last_conversation_topic,
        channel
      });

      generatedMessage = {
        subject: channel === 'email'
          ? `Re: ${propertyAddress || 'Your Property'}`
          : undefined,
        body: aiBody,
        personalization_applied: ['ai_generated'],
        confidence: 0.70
      };
    }

    // Update template use count if applicable
    if (template_id) {
      await supabase
        .schema('investor')
        .from('outreach_templates')
        .update({
          use_count: supabase.sql`use_count + 1`
        })
        .eq('id', template_id);
    }

    const result: InvestorOutreachResponse = {
      success: true,
      message: generatedMessage
    };

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Investor outreach error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
