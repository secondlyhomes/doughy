// The Claw — Agent Tools
// Tools that agents can call to read data and create actions

import { config } from '../config.js';
import { schemaQuery, schemaInsert, schemaUpdate } from './db.js';
import { getContactEmailTimeline } from '../services/email-capture.js';
import type { AgentToolName } from './types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate a UUID from AI tool input — prevents PostgREST query injection */
function assertUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${label}: must be a valid UUID`);
  }
  return value;
}

// ============================================================================
// READ Tool Implementations
// ============================================================================

/**
 * Read active deals from investor.deals_pipeline
 */
export async function readDeals(userId: string, input: { limit?: number; stage?: string } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&status=eq.active&select=id,title,stage,estimated_value,probability,expected_close_date,next_action,next_action_due,created_at&order=updated_at.desc&limit=${limit}`;
  if (input.stage) {
    params += `&stage=eq.${encodeURIComponent(input.stage)}`;
  }
  return schemaQuery('investor', 'deals_pipeline', params);
}

/**
 * Read leads/contacts from crm.contacts
 */
export async function readLeads(userId: string, input: { limit?: number; min_score?: number; recent_days?: number } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&select=id,first_name,last_name,email,phone,source,score,status,created_at&order=created_at.desc&limit=${limit}`;

  if (input.min_score) {
    params += `&score=gte.${input.min_score}`;
  }
  if (input.recent_days) {
    const since = new Date(Date.now() - input.recent_days * 86400000).toISOString();
    params += `&created_at=gte.${since}`;
  }

  return schemaQuery('crm', 'contacts', params);
}

/**
 * Read bookings from landlord.bookings
 */
export async function readBookings(userId: string, input: { limit?: number; upcoming_only?: boolean } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&select=id,contact_id,property_id,room_id,booking_type,start_date,end_date,check_in_time,check_out_time,rate,rate_type,total_amount,status,source,notes&order=start_date.asc&limit=${limit}`;

  if (input.upcoming_only !== false) {
    const today = new Date().toISOString().split('T')[0];
    params += `&start_date=gte.${today}`;
  }

  return schemaQuery('landlord', 'bookings', params);
}

/**
 * Read follow-ups from investor.follow_ups
 */
export async function readFollowUps(userId: string, input: { limit?: number; overdue_only?: boolean; upcoming_days?: number } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  const today = new Date().toISOString().split('T')[0];
  let params = `user_id=eq.${userId}&status=eq.scheduled&select=id,contact_id,deal_id,follow_up_type,scheduled_at,context,created_at&order=scheduled_at.asc&limit=${limit}`;

  if (input.overdue_only) {
    params += `&scheduled_at=lt.${today}`;
  } else if (input.upcoming_days) {
    const until = new Date(Date.now() + input.upcoming_days * 86400000).toISOString().split('T')[0];
    params += `&scheduled_at=gte.${today}&scheduled_at=lte.${until}`;
  }

  return schemaQuery('investor', 'follow_ups', params);
}

/**
 * Read maintenance records from landlord.maintenance_records
 */
export async function readMaintenance(userId: string, input: { limit?: number; status?: string } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&select=id,property_id,title,description,category,location,status,priority,reported_at,scheduled_at,vendor_name,vendor_phone,estimated_cost,actual_cost,notes&order=reported_at.desc&limit=${limit}`;

  if (input.status) {
    params += `&status=eq.${encodeURIComponent(input.status)}`;
  }

  return schemaQuery('landlord', 'maintenance_records', params);
}

/**
 * Read vendors from landlord.vendors
 */
export async function readVendors(userId: string, input: { limit?: number; category?: string } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&is_active=eq.true&select=id,name,company_name,category,phone,email,hourly_rate,rating,total_jobs,last_used_at,availability_notes&order=rating.desc.nullslast&limit=${limit}`;

  if (input.category) {
    params += `&category=eq.${encodeURIComponent(input.category)}`;
  }

  return schemaQuery('landlord', 'vendors', params);
}

/**
 * Read full contact details from crm.contacts
 */
export async function readContactsDetail(userId: string, input: { limit?: number; search?: string; contact_id?: string } = {}): Promise<unknown> {
  const limit = input.limit || 10;

  if (input.contact_id) {
    assertUuid(input.contact_id, 'contact_id');
    return schemaQuery('crm', 'contacts',
      `id=eq.${input.contact_id}&user_id=eq.${userId}&select=id,first_name,last_name,email,phone,company,source,score,status,tags,city,state,zip,preferred_channel,best_contact_time,is_do_not_contact,metadata,created_at,updated_at`
    );
  }

  let params = `user_id=eq.${userId}&select=id,first_name,last_name,email,phone,company,source,score,status,tags,city,state,preferred_channel,is_do_not_contact,created_at&order=score.desc.nullslast&limit=${limit}`;

  if (input.search) {
    // Search by name (first or last)
    const search = encodeURIComponent(input.search);
    params += `&or=(first_name.ilike.*${search}*,last_name.ilike.*${search}*,company.ilike.*${search}*)`;
  }

  return schemaQuery('crm', 'contacts', params);
}

/**
 * Read investment portfolio from investor.properties
 */
export async function readPortfolio(userId: string, input: { limit?: number } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  return schemaQuery('investor', 'properties',
    `user_id=eq.${userId}&select=id,address_line_1,city,state,zip,property_type,bedrooms,bathrooms,square_feet,purchase_price,arv,status,notes,created_at&order=created_at.desc&limit=${limit}`
  );
}

/**
 * Read documents from investor.documents
 */
export async function readDocuments(userId: string, input: { limit?: number; deal_id?: string; property_id?: string } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  let params = `user_id=eq.${userId}&select=id,title,type,property_id,deal_id,file_url,content_type,created_at&order=created_at.desc&limit=${limit}`;

  if (input.deal_id) {
    assertUuid(input.deal_id, 'deal_id');
    params += `&deal_id=eq.${input.deal_id}`;
  }
  if (input.property_id) {
    assertUuid(input.property_id, 'property_id');
    params += `&property_id=eq.${input.property_id}`;
  }

  return schemaQuery('investor', 'documents', params);
}

/**
 * Read comparable properties from investor.comps
 */
export async function readComps(userId: string, input: { property_id?: string; limit?: number } = {}): Promise<unknown> {
  const limit = input.limit || 10;
  let params = `created_by=eq.${userId}&select=id,property_id,address,city,state,bedrooms,bathrooms,square_feet,sale_price,sale_date,price_per_sqft,days_on_market,distance&order=sale_date.desc&limit=${limit}`;

  if (input.property_id) {
    assertUuid(input.property_id, 'property_id');
    params += `&property_id=eq.${input.property_id}`;
  }

  return schemaQuery('investor', 'comps', params);
}

/**
 * Read campaigns from investor.campaigns
 */
export async function readCampaigns(userId: string, input: { limit?: number; status?: string } = {}): Promise<unknown> {
  const limit = input.limit || 10;
  let params = `user_id=eq.${userId}&select=id,name,campaign_type,status,budget,spent,cost_per_lead,leads_generated,deals_closed,enrolled_count,responded_count,start_date,end_date&order=created_at.desc&limit=${limit}`;

  if (input.status) {
    params += `&status=eq.${encodeURIComponent(input.status)}`;
  }

  return schemaQuery('investor', 'campaigns', params);
}

/**
 * Read recent conversations
 */
export async function readConversations(userId: string, input: { limit?: number } = {}): Promise<unknown> {
  const limit = input.limit || 20;
  return schemaQuery('investor', 'conversations',
    `user_id=eq.${userId}&select=id,contact_id,channel,last_message,last_message_at,status,unread_count&order=last_message_at.desc&limit=${limit}`
  );
}

// ============================================================================
// WRITE Tool Implementations
// ============================================================================

/**
 * Draft an SMS/WhatsApp message (returns the draft, doesn't send)
 */
export function draftSms(_userId: string, input: {
  recipient_name: string;
  recipient_phone: string;
  message: string;
  context?: string;
}): unknown {
  return {
    recipient_name: input.recipient_name,
    recipient_phone: input.recipient_phone,
    draft_content: input.message,
    context: input.context || '',
  };
}

/**
 * Create an approval entry in claw.approvals
 */
export async function createApproval(userId: string, input: {
  task_id: string;
  agent_run_id?: string;
  action_type: string;
  title: string;
  description?: string;
  draft_content: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_email?: string;
  action_payload?: Record<string, unknown>;
}): Promise<unknown> {
  return schemaInsert('claw', 'approvals', {
    user_id: userId,
    task_id: input.task_id,
    agent_run_id: input.agent_run_id || null,
    status: 'pending',
    action_type: input.action_type,
    title: input.title,
    description: input.description || null,
    draft_content: input.draft_content,
    recipient_name: input.recipient_name || null,
    recipient_phone: input.recipient_phone || null,
    recipient_email: input.recipient_email || null,
    action_payload: input.action_payload || {},
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Create a new lead in crm.contacts
 */
export async function createLead(userId: string, input: {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  score?: number;
  city?: string;
  state?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  return schemaInsert('crm', 'contacts', {
    user_id: userId,
    first_name: input.first_name,
    last_name: input.last_name || null,
    phone: input.phone || null,
    email: input.email || null,
    source: input.source || 'manual',
    status: input.status || 'new',
    score: input.score || 50,
    city: input.city || null,
    state: input.state || null,
    tags: input.tags || [],
    metadata: input.metadata || {},
  });
}

/**
 * Update an existing lead in crm.contacts
 */
export async function updateLead(userId: string, input: {
  contact_id: string;
  status?: string;
  score?: number;
  phone?: string;
  email?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  assertUuid(input.contact_id, 'contact_id');
  const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status !== undefined) data.status = input.status;
  if (input.score !== undefined) data.score = input.score;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.metadata !== undefined) data.metadata = input.metadata;

  const success = await schemaUpdate('crm', 'contacts', input.contact_id, data);
  return { success, contact_id: input.contact_id };
}

/**
 * Update a deal's stage in investor.deals_pipeline
 */
export async function updateDealStage(userId: string, input: {
  deal_id: string;
  stage: string;
  next_action?: string;
  next_action_due?: string;
}): Promise<unknown> {
  assertUuid(input.deal_id, 'deal_id');
  const data: Record<string, unknown> = {
    stage: input.stage,
    updated_at: new Date().toISOString(),
  };
  if (input.next_action) data.next_action = input.next_action;
  if (input.next_action_due) data.next_action_due = input.next_action_due;

  const success = await schemaUpdate('investor', 'deals_pipeline', input.deal_id, data);
  return { success, deal_id: input.deal_id, new_stage: input.stage };
}

/**
 * Mark a follow-up as completed
 */
export async function markFollowupComplete(userId: string, input: {
  followup_id: string;
}): Promise<unknown> {
  assertUuid(input.followup_id, 'followup_id');
  const success = await schemaUpdate('investor', 'follow_ups', input.followup_id, {
    status: 'completed',
    updated_at: new Date().toISOString(),
  });
  return { success, followup_id: input.followup_id };
}

/**
 * Send a WhatsApp message via Twilio (creates approval first)
 */
export function sendWhatsapp(_userId: string, input: {
  recipient_name: string;
  recipient_phone: string;
  message: string;
  context?: string;
}): unknown {
  // Returns draft data — agents should call create_approval after this
  return {
    channel: 'whatsapp',
    recipient_name: input.recipient_name,
    recipient_phone: input.recipient_phone,
    draft_content: input.message,
    context: input.context || '',
    note: 'Create an approval entry to send this message',
  };
}

/**
 * Send an email (creates approval first)
 */
export function sendEmail(_userId: string, input: {
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  context?: string;
}): unknown {
  return {
    channel: 'email',
    recipient_name: input.recipient_name,
    recipient_email: input.recipient_email,
    subject: input.subject,
    draft_content: input.body,
    context: input.context || '',
    note: 'Create an approval entry to send this email',
  };
}

/**
 * Add a note (generic — stored as metadata on various tables)
 */
export async function addNote(userId: string, input: {
  target_type: string; // 'deal', 'lead', 'property', 'maintenance'
  target_id: string;
  note: string;
}): Promise<unknown> {
  // Map target types to schemas/tables
  const mapping: Record<string, { schema: string; table: string; field: string }> = {
    deal: { schema: 'investor', table: 'deals_pipeline', field: 'notes' },
    lead: { schema: 'crm', table: 'contacts', field: 'metadata' },
    property: { schema: 'investor', table: 'properties', field: 'notes' },
    maintenance: { schema: 'landlord', table: 'maintenance_records', field: 'notes' },
  };

  const target = mapping[input.target_type];
  if (!target) return { error: `Unknown target type: ${input.target_type}` };
  assertUuid(input.target_id, 'target_id');

  // For text fields, append; for JSONB, add to notes array
  if (target.field === 'metadata') {
    // For contacts: append note to metadata.notes array
    const contacts = await schemaQuery<{ metadata: Record<string, unknown> }>(
      target.schema, target.table,
      `id=eq.${input.target_id}&user_id=eq.${userId}&select=metadata&limit=1`
    );
    const existing = contacts[0]?.metadata || {};
    const notes = Array.isArray(existing.notes) ? existing.notes : [];
    notes.push({ text: input.note, created_at: new Date().toISOString() });
    await schemaUpdate(target.schema, target.table, input.target_id, {
      metadata: { ...existing, notes },
      updated_at: new Date().toISOString(),
    });
  } else {
    // For text fields, append
    const records = await schemaQuery<{ notes: string | null }>(
      target.schema, target.table,
      `id=eq.${input.target_id}&user_id=eq.${userId}&select=notes&limit=1`
    );
    const existingNotes = records[0]?.notes || '';
    const separator = existingNotes ? '\n\n' : '';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    await schemaUpdate(target.schema, target.table, input.target_id, {
      notes: `${existingNotes}${separator}[${timestamp}] ${input.note}`,
      updated_at: new Date().toISOString(),
    });
  }

  return { success: true, target_type: input.target_type, target_id: input.target_id };
}

/**
 * Create a maintenance request
 */
export async function createMaintenanceRequest(userId: string, input: {
  property_id: string;
  title: string;
  description?: string;
  priority?: string;
  category?: string;
  location?: string;
}): Promise<unknown> {
  assertUuid(input.property_id, 'property_id');
  return schemaInsert('landlord', 'maintenance_records', {
    user_id: userId,
    property_id: input.property_id,
    title: input.title,
    description: input.description || null,
    priority: input.priority || 'medium',
    category: input.category || 'general',
    location: input.location || null,
    status: 'reported',
    reported_at: new Date().toISOString(),
  });
}

// ============================================================================
// Tool Registry — maps tool names to implementations
// ============================================================================

export const TOOL_REGISTRY: Record<string, {
  description: string;
  execute: (userId: string, input: Record<string, unknown>) => Promise<unknown> | unknown;
}> = {
  // Read tools
  read_deals: {
    description: 'Read active deals from the investment pipeline. Filter by stage optionally.',
    execute: (userId, input) => readDeals(userId, input as any),
  },
  read_leads: {
    description: 'Read leads and contacts from CRM. Filter by score or recency.',
    execute: (userId, input) => readLeads(userId, input as any),
  },
  read_bookings: {
    description: 'Read bookings from rental properties. Defaults to upcoming only.',
    execute: (userId, input) => readBookings(userId, input as any),
  },
  read_follow_ups: {
    description: 'Read pending follow-ups (overdue or upcoming) from the investment pipeline.',
    execute: (userId, input) => readFollowUps(userId, input as any),
  },
  read_maintenance: {
    description: 'Read maintenance requests for rental properties. Filter by status (reported, in_progress, completed).',
    execute: (userId, input) => readMaintenance(userId, input as any),
  },
  read_vendors: {
    description: 'Read property vendors and service providers. Filter by category.',
    execute: (userId, input) => readVendors(userId, input as any),
  },
  read_contacts_detail: {
    description: 'Read full contact details from CRM. Search by name or get specific contact by ID.',
    execute: (userId, input) => readContactsDetail(userId, input as any),
  },
  read_portfolio: {
    description: 'Read investment properties portfolio with financial details.',
    execute: (userId, input) => readPortfolio(userId, input as any),
  },
  read_documents: {
    description: 'Read deal/property documents. Filter by deal_id or property_id.',
    execute: (userId, input) => readDocuments(userId, input as any),
  },
  read_comps: {
    description: 'Read comparable property sales. Filter by property_id.',
    execute: (userId, input) => readComps(userId, input as any),
  },
  read_campaigns: {
    description: 'Read marketing campaigns with performance metrics.',
    execute: (userId, input) => readCampaigns(userId, input as any),
  },
  read_conversations: {
    description: 'Read recent conversation history across channels.',
    execute: (userId, input) => readConversations(userId, input as any),
  },

  // Write tools
  draft_sms: {
    description: 'Draft an SMS/WhatsApp message for a contact (does not send — create an approval after)',
    execute: (userId, input) => draftSms(userId, input as any),
  },
  create_approval: {
    description: 'Create an approval entry for human review before executing an action',
    execute: (userId, input) => createApproval(userId, input as any),
  },
  create_lead: {
    description: 'Create a new lead/contact in CRM',
    execute: (userId, input) => createLead(userId, input as any),
  },
  update_lead: {
    description: 'Update a lead/contact status, score, or details',
    execute: (userId, input) => updateLead(userId, input as any),
  },
  update_deal_stage: {
    description: 'Move a deal to a new pipeline stage',
    execute: (userId, input) => updateDealStage(userId, input as any),
  },
  mark_followup_complete: {
    description: 'Mark a follow-up as completed',
    execute: (userId, input) => markFollowupComplete(userId, input as any),
  },
  send_whatsapp: {
    description: 'Draft a WhatsApp message (default for "text someone"). Must create approval to actually send.',
    execute: (userId, input) => sendWhatsapp(userId, input as any),
  },
  send_email: {
    description: 'Draft an email. Must create approval to actually send.',
    execute: (userId, input) => sendEmail(userId, input as any),
  },
  add_note: {
    description: 'Add a note to a deal, lead, property, or maintenance record',
    execute: (userId, input) => addNote(userId, input as any),
  },
  create_maintenance_request: {
    description: 'Create a new maintenance request for a rental property',
    execute: (userId, input) => createMaintenanceRequest(userId, input as any),
  },
  read_email_timeline: {
    description: 'Read email interaction history for a CRM contact. Shows inbound/outbound emails with sentiment and AI analysis.',
    execute: (userId, input) => getContactEmailTimeline(userId, (input as any).contact_id, (input as any).limit),
  },
};
