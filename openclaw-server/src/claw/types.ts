// The Claw — Types for the intelligence layer

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
  | 'unknown';

// Briefing data collected from cross-schema reads
export interface BriefingData {
  overdueTasks: Array<{
    id: string;
    contact_name: string;
    type: string;
    due_date: string;
    deal_name?: string;
  }>;
  upcomingFollowUps: Array<{
    id: string;
    contact_name: string;
    type: string;
    due_date: string;
    deal_name?: string;
  }>;
  upcomingBookings: Array<{
    id: string;
    guest_name: string;
    property_name: string;
    start_date: string;
    end_date: string;
    status: string;
  }>;
  recentLeads: Array<{
    id: string;
    name: string;
    source: string;
    score: number | null;
    created_at: string;
  }>;
  dealsSummary: {
    total_active: number;
    total_value: number;
    stages: Record<string, number>;
  };
  unreadMessages: number;
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
  | 'read_deals'
  | 'read_leads'
  | 'read_bookings'
  | 'read_follow_ups'
  | 'draft_sms'
  | 'create_approval';

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
