// src/features/campaigns/hooks/campaigns/types.ts
// Type definitions for campaign hooks

import type { DripLeadType, DripChannel, CampaignStep } from '../../types';

export interface CampaignFilters {
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'all';
  lead_type?: DripLeadType;
  is_drip_campaign?: boolean;
  search?: string;
}

export interface CreateCampaignInput {
  name: string;
  campaign_type?: string;
  lead_type?: DripLeadType;
  target_motivation?: 'hot' | 'warm' | 'cold' | 'not_motivated';
  is_drip_campaign?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  respect_weekends?: boolean;
  auto_pause_on_response?: boolean;
  target_markets?: string[];
  notes?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  id: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface CreateStepInput {
  campaign_id: string;
  step_number: number;
  delay_days: number;
  delay_from_enrollment?: boolean;
  channel: DripChannel;
  subject?: string;
  message_body?: string;
  template_id?: string;
  use_ai_generation?: boolean;
  ai_tone?: string;
  mail_piece_type?: string;
  mail_template_id?: string;
  talking_points?: string[];
  call_script?: string;
  skip_if_responded?: boolean;
  skip_if_converted?: boolean;
}

export interface EnrollContactsInput {
  campaign_id: string;
  contact_ids: string[];
  deal_id?: string;
  context?: {
    property_address?: string;
    pain_points?: string[];
    motivation_score?: number;
  };
  start_immediately?: boolean;
  allow_re_enrollment?: boolean;
}

export interface UpdateStepInput extends Partial<CampaignStep> {
  id: string;
}

export interface DeleteStepInput {
  id: string;
  campaignId: string;
}

export interface PauseEnrollmentInput {
  id: string;
  reason?: string;
}
