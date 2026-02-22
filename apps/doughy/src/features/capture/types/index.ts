// src/features/capture/types/index.ts
// Types for the Capture feature (intake & triage center)

export type CaptureItemType = 'recording' | 'call' | 'text' | 'transcript' | 'document' | 'email' | 'note' | 'photo';
export type CaptureItemStatus = 'pending' | 'processing' | 'ready' | 'assigned' | 'dismissed';

export interface CaptureItem {
  id: string;
  user_id: string;

  // Item type and content
  type: CaptureItemType;
  title?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number; // For recordings
  transcript?: string;
  content?: string; // For notes/emails

  // AI processing
  ai_summary?: string;
  ai_extracted_data?: Record<string, unknown>;
  suggested_lead_id?: string;
  suggested_property_id?: string;
  ai_confidence?: number; // 0.00 to 1.00

  // Assignment (after triage)
  assigned_lead_id?: string;
  assigned_property_id?: string;
  assigned_deal_id?: string;

  // Status and workflow
  status: CaptureItemStatus;
  triaged_at?: string;
  triaged_by?: string;

  // Metadata
  source?: string; // 'app_recording', 'upload', 'email_import', 'manual'
  metadata?: Record<string, unknown>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CaptureItemInsert {
  type: CaptureItemType;
  title?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  transcript?: string;
  content?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  /** Auto-assign to a property when creating (for Focus mode) */
  assigned_property_id?: string;
}

export interface CaptureItemUpdate {
  title?: string;
  transcript?: string;
  content?: string;
  ai_summary?: string;
  ai_extracted_data?: Record<string, unknown>;
  suggested_lead_id?: string | null;
  suggested_property_id?: string | null;
  assigned_lead_id?: string | null;
  assigned_property_id?: string | null;
  assigned_deal_id?: string | null;
  status?: CaptureItemStatus;
  triaged_at?: string;
  triaged_by?: string;
}

// For the Push to Lead modal
export interface PushToLeadData {
  lead_id?: string;
  property_id?: string;
  deal_id?: string;
  create_new_lead?: boolean;
  new_lead_name?: string;
}
