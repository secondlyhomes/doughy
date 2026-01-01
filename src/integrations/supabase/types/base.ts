// src/integrations/supabase/types/base.ts
import type { Json } from './common';
import type { 
  LeadStatus, MessageChannel, MessageDirection, 
  MessageStatus, PlanTier, SmsOptStatus, UserRole 
} from './constants';

// Define empty Database interface structure that will be filled by domains
export interface Database {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {
      lead_status: LeadStatus
      message_channel: MessageChannel
      message_direction: MessageDirection
      message_status: MessageStatus
      plan_tier: PlanTier
      sms_opt_status: SmsOptStatus
      user_role: UserRole
    }
    CompositeTypes: {}
  }
}
