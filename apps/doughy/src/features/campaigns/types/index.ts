// src/features/campaigns/types/index.ts
// Type definitions for drip campaigns

// Lead types for situation-specific campaigns
export type DripLeadType =
  | 'preforeclosure'
  | 'probate'
  | 'divorce'
  | 'tired_landlord'
  | 'vacant_property'
  | 'tax_lien'
  | 'absentee_owner'
  | 'code_violation'
  | 'high_equity'
  | 'expired_listing'
  | 'general';

// Campaign channels
export type DripChannel =
  | 'sms'
  | 'email'
  | 'direct_mail'
  | 'meta_dm'
  | 'phone_reminder';

// Mail piece types
export type MailPieceType =
  | 'postcard_4x6'
  | 'postcard_6x9'
  | 'postcard_6x11'
  | 'yellow_letter'
  | 'letter_1_page'
  | 'letter_2_page';

// Enrollment status
export type DripEnrollmentStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'responded'
  | 'converted'
  | 'opted_out'
  | 'bounced'
  | 'expired';

// Touch execution status
export type DripTouchStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'skipped'
  | 'bounced';

// Campaign step
export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  delay_days: number;
  delay_from_enrollment: boolean;
  channel: DripChannel;
  subject?: string;
  message_body?: string;
  template_id?: string;
  use_ai_generation: boolean;
  ai_tone?: string;
  mail_piece_type?: MailPieceType;
  mail_template_id?: string;
  talking_points?: string[];
  call_script?: string;
  skip_if_responded: boolean;
  skip_if_converted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Campaign with drip settings
export interface DripCampaign {
  id: string;
  user_id: string;
  name: string;
  campaign_type: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  lead_type?: DripLeadType;
  target_motivation?: 'hot' | 'warm' | 'cold' | 'not_motivated';
  is_drip_campaign: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone: string;
  respect_weekends: boolean;
  auto_pause_on_response: boolean;
  auto_convert_on_response: boolean;
  enrolled_count: number;
  responded_count: number;
  converted_count: number;
  opted_out_count: number;
  target_criteria?: Record<string, unknown>;
  target_markets?: string[];
  budget?: number;
  spent: number;
  follow_up_sequence?: number[];
  max_touches: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  steps?: CampaignStep[];
}

// Enrollment
export interface DripEnrollment {
  id: string;
  user_id: string;
  campaign_id: string;
  contact_id: string;
  deal_id?: string;
  current_step: number;
  next_touch_at?: string;
  status: DripEnrollmentStatus;
  touches_sent: number;
  touches_delivered: number;
  touches_failed: number;
  last_touch_at?: string;
  last_touch_channel?: DripChannel;
  responded_at?: string;
  response_channel?: DripChannel;
  response_message?: string;
  converted_at?: string;
  converted_deal_id?: string;
  paused_at?: string;
  paused_reason?: string;
  resumed_at?: string;
  enrollment_context?: Record<string, unknown>;
  enrolled_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  campaign?: {
    id: string;
    name: string;
  };
}

// Touch log entry
export interface TouchLogEntry {
  id: string;
  user_id: string;
  enrollment_id: string;
  step_id: string;
  channel: DripChannel;
  status: DripTouchStatus;
  subject?: string;
  message_body?: string;
  recipient_phone?: string;
  recipient_email?: string;
  recipient_address?: Record<string, unknown>;
  external_message_id?: string;
  external_tracking_url?: string;
  mail_piece_type?: MailPieceType;
  mail_cost?: number;
  mail_tracking_number?: string;
  scheduled_at: string;
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  retry_count: number;
  last_retry_at?: string;
  response_received: boolean;
  response_at?: string;
  response_body?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Mail credits
export interface MailCredits {
  id: string;
  user_id: string;
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  reserved: number;
  low_balance_threshold: number;
  low_balance_alert_sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Mail credit transaction
export interface MailCreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'usage' | 'refund' | 'adjustment';
  amount: number;
  balance_after: number;
  stripe_payment_id?: string;
  package_name?: string;
  package_price?: number;
  touch_log_id?: string;
  mail_piece_type?: MailPieceType;
  pieces_count?: number;
  refund_reason?: string;
  original_transaction_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Credit package (for purchase)
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  price_formatted: string;
  per_credit: string;
  savings_percent?: number;
}

// Contact opt-out
export interface ContactOptOut {
  id: string;
  user_id: string;
  contact_id: string;
  channel: DripChannel;
  opted_out_at: string;
  opt_out_reason?: string;
  opt_out_message?: string;
  source_campaign_id?: string;
  source_touch_id?: string;
  is_active: boolean;
  opted_in_at?: string;
  opt_in_reason?: string;
  created_at: string;
}

// Meta DM credentials status
export interface MetaDMCredentials {
  id: string;
  user_id: string;
  page_id: string;
  page_name?: string;
  instagram_account_id?: string;
  instagram_username?: string;
  token_expires_at?: string;
  permissions?: string[];
  daily_dm_count: number;
  daily_dm_reset_at?: string;
  hourly_dm_count: number;
  hourly_dm_reset_at?: string;
  is_active: boolean;
  last_error?: string;
  last_error_at?: string;
  created_at: string;
  updated_at: string;
}

// PostGrid credentials
export interface PostGridCredentials {
  id: string;
  user_id: string;
  return_name?: string;
  return_company?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_zip?: string;
  default_mail_class: 'first_class' | 'standard';
  is_active: boolean;
  last_mail_sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Lead type configurations
export const LEAD_TYPE_CONFIG: Record<DripLeadType, {
  label: string;
  description: string;
  defaultCadence: number[];
  tone: string;
}> = {
  preforeclosure: {
    label: 'Preforeclosure',
    description: 'Urgent, empathetic about credit impact',
    defaultCadence: [3, 5, 7, 14, 21],
    tone: 'urgent'
  },
  probate: {
    label: 'Probate/Deceased',
    description: 'Gentle, patient, never pushy',
    defaultCadence: [14, 30, 60, 90],
    tone: 'gentle'
  },
  divorce: {
    label: 'Divorce',
    description: 'Sensitive, focus on quick resolution',
    defaultCadence: [5, 14, 30, 45],
    tone: 'sensitive'
  },
  tired_landlord: {
    label: 'Tired Landlord',
    description: 'Solution-focused, freedom from hassle',
    defaultCadence: [3, 10, 21, 35],
    tone: 'solution_focused'
  },
  vacant_property: {
    label: 'Vacant Property',
    description: 'Practical, asset protection angle',
    defaultCadence: [3, 7, 21, 35],
    tone: 'practical'
  },
  tax_lien: {
    label: 'Tax Lien',
    description: 'Deadline-aware, urgent',
    defaultCadence: [1, 5, 10, 20],
    tone: 'urgent'
  },
  absentee_owner: {
    label: 'Absentee Owner',
    description: 'Investment-focused, convenience',
    defaultCadence: [5, 14, 28, 42],
    tone: 'professional'
  },
  code_violation: {
    label: 'Code Violation',
    description: 'Problem-solving, deadline awareness',
    defaultCadence: [3, 7, 14, 28],
    tone: 'helpful'
  },
  high_equity: {
    label: 'High Equity',
    description: 'Value proposition, cash offer benefits',
    defaultCadence: [7, 21, 45, 60],
    tone: 'professional'
  },
  expired_listing: {
    label: 'Expired Listing',
    description: 'Fresh approach, alternative to agents',
    defaultCadence: [3, 7, 14, 28],
    tone: 'consultative'
  },
  general: {
    label: 'General',
    description: 'Balanced approach for general leads',
    defaultCadence: [5, 14, 28, 45],
    tone: 'friendly'
  }
};

// Channel display config
export const CHANNEL_CONFIG: Record<DripChannel, {
  label: string;
  icon: string;
  color: string;
}> = {
  sms: {
    label: 'SMS',
    icon: 'message-square',
    color: '#10B981' // green
  },
  email: {
    label: 'Email',
    icon: 'mail',
    color: '#3B82F6' // blue
  },
  direct_mail: {
    label: 'Direct Mail',
    icon: 'send',
    color: '#F59E0B' // amber
  },
  meta_dm: {
    label: 'Facebook/Instagram',
    icon: 'message-circle',
    color: '#8B5CF6' // purple
  },
  phone_reminder: {
    label: 'Call Reminder',
    icon: 'phone',
    color: '#EF4444' // red
  }
};

// Mail piece config
export const MAIL_PIECE_CONFIG: Record<MailPieceType, {
  label: string;
  description: string;
  price: number;
}> = {
  postcard_4x6: {
    label: 'Postcard (4x6)',
    description: 'Standard postcard',
    price: 1.49
  },
  postcard_6x9: {
    label: 'Postcard (6x9)',
    description: 'Large postcard, more space',
    price: 1.99
  },
  postcard_6x11: {
    label: 'Postcard (6x11)',
    description: 'Jumbo postcard, maximum impact',
    price: 2.49
  },
  yellow_letter: {
    label: 'Yellow Letter',
    description: 'Handwritten-style, high response rate',
    price: 2.99
  },
  letter_1_page: {
    label: 'Letter (1 page)',
    description: 'Professional typed letter',
    price: 2.49
  },
  letter_2_page: {
    label: 'Letter (2 pages)',
    description: 'Detailed letter for complex messages',
    price: 3.49
  }
};
