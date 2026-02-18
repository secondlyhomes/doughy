/**
 * Investor Bridge Edge Function
 *
 * Bridge between MoltBot AI and investor-specific database operations.
 * Handles deals, agents, campaigns, and follow-ups for RE investors.
 *
 * @see /moltbot-skills/doughy-investor-core/SKILL.md for API contracts
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

type InvestorAction =
  | 'create_deal'
  | 'update_deal'
  | 'get_deal'
  | 'list_deals'
  | 'update_deal_stage'
  | 'create_agent'
  | 'update_agent'
  | 'list_agents'
  | 'create_campaign'
  | 'list_campaigns'
  | 'schedule_follow_up'
  | 'complete_follow_up'
  | 'get_due_follow_ups'
  | 'get_pipeline_stats';

interface InvestorBridgeRequest {
  action: InvestorAction;
  user_id: string;
  payload: Record<string, unknown>;
}

interface InvestorBridgeResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// =============================================================================
// Action Handlers
// =============================================================================

async function handleCreateDeal(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const dealData = {
    user_id: userId,
    property_address: payload.property_address,
    property_city: payload.property_city,
    property_state: payload.property_state,
    property_zip: payload.property_zip,
    property_county: payload.property_county,
    property_type: payload.property_type,
    seller_contact_id: payload.contact_id,
    seller_name: payload.seller_name,
    seller_phone: payload.seller_phone,
    seller_email: payload.seller_email,
    deal_type: payload.deal_type || 'wholesale',
    stage: payload.stage || 'lead',
    source: payload.source || 'other',
    source_campaign_id: payload.campaign_id,
    notes: payload.notes,
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .schema('investor')
    .from('deals')
    .insert(dealData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { deal: data } };
}

async function handleUpdateDeal(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const { deal_id, ...updates } = payload;

  if (!deal_id) {
    return { success: false, error: 'Missing deal_id' };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  // Map allowed fields
  const allowedFields = [
    'property_address', 'property_city', 'property_state', 'property_zip',
    'seller_contact_id', 'seller_name', 'seller_phone', 'seller_email',
    'deal_type', 'stage', 'motivation', 'motivation_score',
    'asking_price', 'offer_price', 'arv', 'repair_estimate', 'wholesale_fee', 'profit_estimate',
    'contract_date', 'close_date', 'earnest_money', 'contingencies',
    'source', 'pain_points', 'objections', 'notes', 'metadata'
  ];

  for (const field of allowedFields) {
    if (field in updates) {
      updateData[field] = updates[field];
    }
  }

  const { data, error } = await supabase
    .schema('investor')
    .from('deals')
    .update(updateData)
    .eq('id', deal_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { deal: data } };
}

async function handleGetDeal(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const { deal_id, property_address } = payload;

  let query = supabase
    .schema('investor')
    .from('deals')
    .select('*')
    .eq('user_id', userId);

  if (deal_id) {
    query = query.eq('id', deal_id);
  } else if (property_address) {
    const sanitized = (property_address as string)
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    query = query.ilike('property_address', `%${sanitized}%`);
  } else {
    return { success: false, error: 'Missing deal_id or property_address' };
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'Deal not found' };
  }

  return { success: true, data: { deal: data } };
}

async function handleListDeals(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  let query = supabase
    .schema('investor')
    .from('deals')
    .select('*')
    .eq('user_id', userId);

  // Apply filters
  if (payload.stage) {
    query = query.eq('stage', payload.stage);
  }
  if (payload.motivation) {
    query = query.eq('motivation', payload.motivation);
  }
  if (payload.deal_type) {
    query = query.eq('deal_type', payload.deal_type);
  }
  if (payload.source) {
    query = query.eq('source', payload.source);
  }

  // Sorting
  const sortBy = (payload.sort_by as string) || 'updated_at';
  const sortOrder = payload.sort_order === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  // Pagination
  const limit = Math.min((payload.limit as number) || 50, 100);
  const offset = (payload.offset as number) || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { deals: data, count } };
}

async function handleUpdateDealStage(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const { deal_id, stage, notes } = payload;

  if (!deal_id || !stage) {
    return { success: false, error: 'Missing deal_id or stage' };
  }

  const updateData: Record<string, unknown> = {
    stage,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateData.notes = notes;
  }

  // Set dates based on stage
  if (stage === 'under_contract') {
    updateData.contract_date = new Date().toISOString().split('T')[0];
  } else if (stage === 'closed') {
    updateData.close_date = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .schema('investor')
    .from('deals')
    .update(updateData)
    .eq('id', deal_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { deal: data } };
}

async function handleCreateAgent(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const agentData = {
    user_id: userId,
    contact_id: payload.contact_id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    brokerage: payload.brokerage,
    license_number: payload.license_number,
    relationship_status: payload.relationship_status || 'new',
    specializations: payload.specializations,
    target_markets: payload.target_markets,
    deal_types_interested: payload.deal_types_interested,
    preferred_contact_method: payload.preferred_contact_method,
    commission_preference: payload.commission_preference,
    notes: payload.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .schema('investor')
    .from('agents')
    .insert(agentData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { agent: data } };
}

async function handleUpdateAgent(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const { agent_id, ...updates } = payload;

  if (!agent_id) {
    return { success: false, error: 'Missing agent_id' };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  const allowedFields = [
    'name', 'email', 'phone', 'brokerage', 'license_number',
    'relationship_status', 'deals_sourced', 'last_deal_date',
    'commission_preference', 'specializations', 'target_markets',
    'deal_types_interested', 'preferred_contact_method',
    'last_contact_at', 'next_follow_up_at', 'notes', 'metadata'
  ];

  for (const field of allowedFields) {
    if (field in updates) {
      updateData[field] = updates[field];
    }
  }

  const { data, error } = await supabase
    .schema('investor')
    .from('agents')
    .update(updateData)
    .eq('id', agent_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { agent: data } };
}

async function handleListAgents(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  let query = supabase
    .schema('investor')
    .from('agents')
    .select('*')
    .eq('user_id', userId);

  if (payload.relationship_status) {
    query = query.eq('relationship_status', payload.relationship_status);
  }

  query = query.order('last_contact_at', { ascending: false, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { agents: data } };
}

async function handleCreateCampaign(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const campaignData = {
    user_id: userId,
    name: payload.name,
    campaign_type: payload.campaign_type,
    status: payload.status || 'draft',
    target_criteria: payload.target_criteria,
    target_markets: payload.target_markets,
    list_source: payload.list_source,
    list_count: payload.list_count,
    budget: payload.budget,
    start_date: payload.start_date,
    end_date: payload.end_date,
    follow_up_sequence: payload.follow_up_sequence || [3, 7, 14],
    max_touches: payload.max_touches || 5,
    notes: payload.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .schema('investor')
    .from('campaigns')
    .insert(campaignData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { campaign: data } };
}

async function handleListCampaigns(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  let query = supabase
    .schema('investor')
    .from('campaigns')
    .select('*')
    .eq('user_id', userId);

  if (payload.status) {
    query = query.eq('status', payload.status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { campaigns: data } };
}

async function handleScheduleFollowUp(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const scheduledAt = payload.scheduled_at
    ? new Date(payload.scheduled_at as string)
    : new Date(Date.now() + ((payload.delay_days as number) || 3) * 24 * 60 * 60 * 1000);

  const followUpData = {
    user_id: userId,
    deal_id: payload.deal_id,
    contact_id: payload.contact_id,
    agent_id: payload.agent_id,
    campaign_id: payload.campaign_id,
    follow_up_type: payload.follow_up_type || 'seller_check_in',
    scheduled_at: scheduledAt.toISOString(),
    channel: payload.channel || 'email',
    message_template: payload.message_template,
    sequence_position: payload.sequence_position,
    is_final_touch: payload.is_final_touch || false,
    context: payload.context || {},
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .schema('investor')
    .from('follow_ups')
    .insert(followUpData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update deal/agent with next follow-up date
  if (payload.deal_id) {
    await supabase
      .schema('investor')
      .from('deals')
      .update({ ai_follow_up_scheduled_at: scheduledAt.toISOString() })
      .eq('id', payload.deal_id);
  }
  if (payload.agent_id) {
    await supabase
      .schema('investor')
      .from('agents')
      .update({ next_follow_up_at: scheduledAt.toISOString() })
      .eq('id', payload.agent_id);
  }

  return { success: true, data: { follow_up: data } };
}

async function handleCompleteFollowUp(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const { follow_up_id, actual_message, status } = payload;

  if (!follow_up_id) {
    return { success: false, error: 'Missing follow_up_id' };
  }

  const { data, error } = await supabase
    .schema('investor')
    .from('follow_ups')
    .update({
      status: status || 'completed',
      completed_at: new Date().toISOString(),
      actual_message: actual_message
    })
    .eq('id', follow_up_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { follow_up: data } };
}

async function handleGetDueFollowUps(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  const limit = (payload.limit as number) || 20;

  const { data, error } = await supabase
    .schema('investor')
    .from('follow_ups')
    .select(`
      *,
      deal:investor.deals(id, property_address, seller_name, motivation),
      contact:crm.contacts(id, first_name, last_name, email, phone),
      agent:investor.agents(id, name, email)
    `)
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { follow_ups: data } };
}

async function handleGetPipelineStats(
  supabase: SupabaseClient,
  userId: string,
  _payload: Record<string, unknown>
): Promise<InvestorBridgeResponse> {
  // Get deal counts by stage
  const { data: deals, error: dealsError } = await supabase
    .schema('investor')
    .from('deals')
    .select('stage, motivation')
    .eq('user_id', userId);

  if (dealsError) {
    return { success: false, error: dealsError.message };
  }

  const stageCounts: Record<string, number> = {};
  const motivationCounts: Record<string, number> = {};

  for (const deal of deals || []) {
    stageCounts[deal.stage] = (stageCounts[deal.stage] || 0) + 1;
    if (deal.motivation) {
      motivationCounts[deal.motivation] = (motivationCounts[deal.motivation] || 0) + 1;
    }
  }

  // Get pending follow-ups count
  const { count: pendingFollowUps } = await supabase
    .schema('investor')
    .from('follow_ups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  // Get active campaigns count
  const { count: activeCampaigns } = await supabase
    .schema('investor')
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  return {
    success: true,
    data: {
      total_deals: deals?.length || 0,
      by_stage: stageCounts,
      by_motivation: motivationCounts,
      pending_follow_ups: pendingFollowUps || 0,
      active_campaigns: activeCampaigns || 0
    }
  };
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

    // Parse request
    const body: InvestorBridgeRequest = await req.json();
    const { action, user_id, payload } = body;

    if (!action || !user_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing action or user_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    if (authUser.id !== user_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'User ID mismatch' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Route to handler
    let result: InvestorBridgeResponse;

    switch (action) {
      case 'create_deal':
        result = await handleCreateDeal(supabase, user_id, payload);
        break;
      case 'update_deal':
        result = await handleUpdateDeal(supabase, user_id, payload);
        break;
      case 'get_deal':
        result = await handleGetDeal(supabase, user_id, payload);
        break;
      case 'list_deals':
        result = await handleListDeals(supabase, user_id, payload);
        break;
      case 'update_deal_stage':
        result = await handleUpdateDealStage(supabase, user_id, payload);
        break;
      case 'create_agent':
        result = await handleCreateAgent(supabase, user_id, payload);
        break;
      case 'update_agent':
        result = await handleUpdateAgent(supabase, user_id, payload);
        break;
      case 'list_agents':
        result = await handleListAgents(supabase, user_id, payload);
        break;
      case 'create_campaign':
        result = await handleCreateCampaign(supabase, user_id, payload);
        break;
      case 'list_campaigns':
        result = await handleListCampaigns(supabase, user_id, payload);
        break;
      case 'schedule_follow_up':
        result = await handleScheduleFollowUp(supabase, user_id, payload);
        break;
      case 'complete_follow_up':
        result = await handleCompleteFollowUp(supabase, user_id, payload);
        break;
      case 'get_due_follow_ups':
        result = await handleGetDueFollowUps(supabase, user_id, payload);
        break;
      case 'get_pipeline_stats':
        result = await handleGetPipelineStats(supabase, user_id, payload);
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    const status = result.success ? 200 : 400;
    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('Investor bridge error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
