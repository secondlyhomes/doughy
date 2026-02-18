// src/features/turnovers/types/index.ts
// Type definitions for turnovers feature

/** Turnover status progression */
export type TurnoverStatus =
  | 'pending'           // Booking ended, turnover not started
  | 'cleaning_scheduled' // Cleaner has been scheduled
  | 'cleaning_done'     // Cleaning completed
  | 'inspected'         // Inspection completed
  | 'ready';            // Ready for next guest

/** Status configuration for display */
export interface TurnoverStatusConfig {
  label: string;
  color: 'warning' | 'info' | 'default' | 'success';
  emoji: string;
  description: string;
}

export const TURNOVER_STATUS_CONFIG: Record<TurnoverStatus, TurnoverStatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'warning',
    emoji: '⏳',
    description: 'Waiting for cleaning to be scheduled',
  },
  cleaning_scheduled: {
    label: 'Cleaning Scheduled',
    color: 'info',
    emoji: '📅',
    description: 'Cleaner is scheduled to arrive',
  },
  cleaning_done: {
    label: 'Cleaned',
    color: 'default',
    emoji: '🧹',
    description: 'Cleaning completed, awaiting inspection',
  },
  inspected: {
    label: 'Inspected',
    color: 'default',
    emoji: '✅',
    description: 'Inspection completed',
  },
  ready: {
    label: 'Ready',
    color: 'success',
    emoji: '🏠',
    description: 'Ready for next guest',
  },
};

/** AI message record for turnover communication */
export interface TurnoverAIMessage {
  to: string;
  channel: 'sms' | 'email';
  sentAt: string;
  body: string;
  response?: string;
  responseAt?: string;
}

/** Turnover record */
export interface Turnover {
  id: string;
  user_id: string;
  property_id: string;
  booking_id?: string | null;
  checkout_at: string;
  checkin_at?: string | null; // Next booking check-in
  status: TurnoverStatus;
  cleaner_vendor_id?: string | null;
  cleaning_scheduled_at?: string | null;
  cleaning_completed_at?: string | null;
  inspection_completed_at?: string | null;
  inspection_notes?: string | null;
  ai_messages?: TurnoverAIMessage[] | null;
  created_at: string;
  updated_at: string;
}

/** Turnover with related data */
export interface TurnoverWithRelations extends Turnover {
  property?: {
    id: string;
    name: string;
    address: string;
  };
  cleaner?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  booking?: {
    id: string;
    contact?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  };
}

/** Input for creating a turnover */
export interface CreateTurnoverInput {
  property_id: string;
  booking_id?: string;
  checkout_at: string;
  checkin_at?: string;
  cleaner_vendor_id?: string;
}

/** Input for updating a turnover */
export interface UpdateTurnoverInput {
  status?: TurnoverStatus;
  cleaner_vendor_id?: string | null;
  cleaning_scheduled_at?: string | null;
  cleaning_completed_at?: string | null;
  inspection_completed_at?: string | null;
  inspection_notes?: string | null;
}

/** Turnover template for auto-creation */
export interface TurnoverTemplate {
  id: string;
  user_id: string;
  property_id?: string | null; // null = applies to all properties
  name: string;
  default_cleaner_vendor_id?: string | null;
  auto_schedule_cleaning: boolean;
  hours_after_checkout: number; // When to schedule cleaning
  auto_send_guest_checkout_reminder: boolean;
  hours_before_checkout: number; // When to send reminder
  created_at: string;
  updated_at: string;
}
