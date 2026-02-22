
// src/integrations/types/index.ts
export * from './custom-types';

export type { UserPlan, ApiKey, ErrorResponse } from './auth-extensions';

// src/integrations/supabase/types/index.ts
import type { Json } from './common';

// Import all domain-specific tables
import type {
  AssistantSessionsTable,
  CallsTable,
  TranscriptsTable,
  TranscriptSegmentsTable
} from './domains/analytics';

import type { ContactsTable } from './domains/contacts';

import type {
  LeadsTable,
  LeadContactsTable
} from './domains/leads';

import type {
  MessagesTable,
  ScheduledMessagesTable
} from './domains/messaging';

import type {
  RePropertiesTable,
  ReCompsTable
  // Add other real estate tables
} from './domains/real-estate';

import type {
  SystemLogsTable,
  FeatureFlagsTable,
  UsageLogsTable
} from './domains/system';

import type {
  ProfilesTable,
  UserPlansTable,
  RateLimitsTable,
  ApiKeysTable
} from './domains/users';

// Import PostGIS types
import type {
  GeometryDump,
  ValidDetail,
  GeometryColumnsView,
  GeographyColumnsView
} from './postgis/types';

// Import PostGIS functions
import type { PostgisFunctions } from './postgis/functions';

// Import enums
import type {
  LeadStatus,
  MessageChannel,
  MessageDirection,
  MessageStatus,
  PlanTier,
  SmsOptStatus,
  UserRole
} from './constants';

// Re-export utility types
export * from './util';
export * from './constants';
export * from './common';

// Reconstruct the Database type
export interface Database {
  public: {
    Tables: {
      // Analytics related tables
      assistant_sessions: AssistantSessionsTable
      calls: CallsTable
      transcripts: TranscriptsTable
      transcript_segments: TranscriptSegmentsTable
      
      // Contact related tables
      contacts: ContactsTable
      
      // Lead related tables
      leads: LeadsTable
      lead_contacts: LeadContactsTable
      
      // Message related tables
      messages: MessagesTable
      scheduled_messages: ScheduledMessagesTable
      
      // Real estate related tables
      re_properties: RePropertiesTable
      re_comps: ReCompsTable
      // Add other real estate tables
      
      // System related tables
      system_logs: SystemLogsTable
      feature_flags: FeatureFlagsTable
      usage_logs: UsageLogsTable
      
      // User related tables
      profiles: ProfilesTable
      user_plans: UserPlansTable
      rate_limits: RateLimitsTable
      api_keys: ApiKeysTable
      
      // Add any other tables
    }
    Views: {
      geometry_columns: GeometryColumnsView
      geography_columns: GeographyColumnsView
    }
    Functions: PostgisFunctions
    Enums: {
      lead_status: LeadStatus
      message_channel: MessageChannel
      message_direction: MessageDirection
      message_status: MessageStatus
      plan_tier: PlanTier
      sms_opt_status: SmsOptStatus
      user_role: UserRole
    }
    CompositeTypes: {
      geometry_dump: GeometryDump
      valid_detail: ValidDetail
    }
  }
}