// The Claw — Types for the intelligence layer

// Channel types
export type ClawChannel = 'sms' | 'app' | 'whatsapp' | 'telegram' | 'discord' | 'email';

// Intent classification
export type ClawIntent =
  | 'briefing'
  | 'draft_followups'
  | 'check_deal'
  | 'check_bookings'
  | 'new_leads'
  | 'what_did_i_miss'
  | 'help'
  | 'approve'
  | 'query'
  | 'action'
  | 'chat'
  | 'unknown';

// Briefing data — mirrors exactly what the mobile app shows
// Pipeline: Leads | Deals | Portfolio + Investor Inbox + Follow-ups + Bookings
export interface BriefingData {
  leads: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  leadsSummary: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
  };
  dealsSummary: {
    total_active: number;
    total_value: number;
    stages: Record<string, number>;
    needsAction: Array<{
      id: string;
      title: string;
      lead_name: string | null;
      next_action: string | null;
      next_action_due: string | null;
    }>;
  };
  followUps: Array<{
    id: string;
    contact_name: string;
    follow_up_type: string;
    scheduled_at: string;
    context: Record<string, unknown> | null;
  }>;
  bookings: Array<{
    id: string;
    property_id: string;
    start_date: string;
    end_date: string;
    booking_type: string;
    status: string;
  }>;
  portfolio: {
    totalProperties: number;
    totalValue: number;
  };
  inbox: {
    unreadConversations: number;
    pendingAiResponses: number;
  };
}

// Task input/output shapes
export interface TaskInput {
  intent: ClawIntent;
  message: string;
  context?: Record<string, unknown>;
}

export interface TaskOutput {
  response: string;
  approvals_created?: number;
  data?: Record<string, unknown>;
}

// Agent tool definitions
export type AgentToolName =
  // Read tools
  | 'read_deals'
  | 'read_leads'
  | 'read_bookings'
  | 'read_follow_ups'
  | 'read_maintenance'
  | 'read_vendors'
  | 'read_contacts_detail'
  | 'read_portfolio'
  | 'read_documents'
  | 'read_comps'
  | 'read_campaigns'
  | 'read_conversations'
  | 'read_email_timeline'
  // Write tools
  | 'draft_sms'
  | 'create_approval'
  | 'create_lead'
  | 'update_lead'
  | 'update_deal_stage'
  | 'mark_followup_complete'
  | 'send_whatsapp'
  | 'send_email'
  | 'add_note'
  | 'create_maintenance_request';

export interface AgentToolCall {
  tool: AgentToolName;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

// Controller response
export interface ClawResponse {
  message: string;
  task_id?: string;
  approvals_created?: number;
}

// SMS inbound message
export interface ClawSmsInbound {
  from: string;
  to: string;
  body: string;
  messageSid?: string;
}

// Approval decision from the mobile app
export interface ApprovalDecision {
  approval_id: string;
  action: 'approve' | 'reject';
  edited_content?: string; // If user edits the draft before approving
}

// Agent profile from DB
export interface AgentProfile {
  id: string;
  slug: string;
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
  requires_approval: boolean;
}
