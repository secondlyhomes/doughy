// The Claw — Agent Tools
// Tools that agents can call to read data and create actions

import { schemaQuery, schemaInsert } from './db.js';
import type { AgentToolName } from './types.js';

// ============================================================================
// Tool Implementations
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
 * Draft an SMS message (returns the draft, doesn't send)
 */
export function draftSms(_userId: string, input: {
  recipient_name: string;
  recipient_phone: string;
  message: string;
  context?: string;
}): unknown {
  // This tool just returns the draft — the agent orchestrator creates the approval
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

// ============================================================================
// Tool Registry
// ============================================================================

export const TOOL_REGISTRY: Record<AgentToolName, {
  description: string;
  execute: (userId: string, input: Record<string, unknown>) => Promise<unknown> | unknown;
}> = {
  read_deals: {
    description: 'Read active deals from the investment pipeline',
    execute: (userId, input) => readDeals(userId, input as any),
  },
  read_leads: {
    description: 'Read leads and contacts from CRM',
    execute: (userId, input) => readLeads(userId, input as any),
  },
  read_bookings: {
    description: 'Read bookings from rental properties',
    execute: (userId, input) => readBookings(userId, input as any),
  },
  read_follow_ups: {
    description: 'Read pending follow-ups (overdue or upcoming) from the investment pipeline',
    execute: (userId, input) => readFollowUps(userId, input as any),
  },
  draft_sms: {
    description: 'Draft an SMS message for a contact (does not send)',
    execute: (userId, input) => draftSms(userId, input as any),
  },
  create_approval: {
    description: 'Create an approval entry for human review before executing an action',
    execute: (userId, input) => createApproval(userId, input as any),
  },
};
