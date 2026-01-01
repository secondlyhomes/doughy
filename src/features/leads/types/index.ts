// Lead types for React Native
// Converted from web app src/features/leads/hooks/types.ts

export type LeadStatus = 'active' | 'inactive' | 'do_not_contact' | 'new' | 'follow-up' | 'prospect';
export type OptStatus = 'opted_in' | 'opted_out' | 'pending' | 'new';

export interface ContactMethod {
  value: string;
  type: string; // "work", "personal", "other", etc.
  isPrimary: boolean;
}

export interface Lead {
  id: string;
  name: string;
  status: LeadStatus | string;
  phone?: string;
  email?: string;
  company?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  tags?: string[];
  score?: number;
  workspace_id?: string;
  created_at?: string;
  updated_at?: string;
  inserted_at?: string;
  is_deleted?: boolean;

  // Opt Status fields
  opt_status?: OptStatus;
  email_opt_status?: OptStatus;
  phone_opt_status?: OptStatus;
  text_opt_status?: OptStatus;

  source?: string;
  starred?: boolean;
  notes?: Note[];
  contacts?: Contact[];

  // Fields for multiple emails and phones
  emails?: ContactMethod[];
  phones?: ContactMethod[];

  // User association
  user_id?: string;

  // Import tracking
  import_id?: string;
}

export interface Note {
  id: string;
  lead_id: string;
  user_id?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  emails?: {
    value: string;
    type: string;
    is_primary?: boolean;
  }[];
  phones?: {
    value: string;
    type: string;
    is_primary?: boolean;
  }[];
  company?: string;
  is_primary?: boolean;
  job_title?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  tags?: string[];
  notes?: string;
}
