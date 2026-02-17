// Lead types for React Native (RE Investor domain)
// Converted from web app src/features/leads/hooks/types.ts
//
// NAMING CONVENTIONS:
// - InvestorLead: Primary type for RE Investor leads
// - LeadContact: Contact associated with a lead (to distinguish from CRM contacts)
// - Lead/Contact: Backward-compatible aliases (deprecated, use InvestorLead/LeadContact)

// LeadStatus aligned with Supabase database schema
export type LeadStatus = 'active' | 'inactive' | 'new' | 'closed' | 'won' | 'lost';
export type OptStatus = 'opted_in' | 'opted_out' | 'pending' | 'new';

export interface ContactMethod {
  value: string;
  type: string; // "work", "personal", "other", etc.
  isPrimary: boolean;
}

/**
 * Contact associated with an investor lead.
 * Renamed from Contact to LeadContact to distinguish from CRM contacts.
 */
export interface LeadContact {
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

export interface Note {
  id: string;
  lead_id: string;
  user_id?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lead for RE Investor platform.
 * Renamed from Lead to InvestorLead to distinguish from other lead types.
 */
export interface InvestorLead {
  id: string;
  module?: 'investor' | 'landlord';
  name: string;
  status: LeadStatus;
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
  is_deleted?: boolean;

  // Opt Status fields
  opt_status?: OptStatus;
  email_opt_status?: OptStatus;
  phone_opt_status?: OptStatus;
  text_opt_status?: OptStatus;

  source?: string;
  starred?: boolean;
  notes?: Note[];
  contacts?: LeadContact[];

  // Fields for multiple emails and phones
  emails?: ContactMethod[];
  phones?: ContactMethod[];

  // User association
  user_id?: string;

  // Import tracking
  import_id?: string;

  // Activity tracking (Zone G)
  last_contacted_at?: string;
}

// Backward-compatible aliases (deprecated - use InvestorLead/LeadContact instead)
/** @deprecated Use InvestorLead instead */
export type Lead = InvestorLead;
/** @deprecated Use LeadContact instead */
export type Contact = LeadContact;

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  tags?: string[];
  notes?: string;
}

// Property image for LeadProperty
export interface LeadPropertyImage {
  id: string;
  url: string;
  is_primary?: boolean;
  label?: string;
}

// Extended lead type with associated properties (for hierarchical view)
export interface LeadProperty {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  arv?: number;
  purchase_price?: number;
  status?: string;
  property_type?: string;
  images?: LeadPropertyImage[];
}

export interface LeadWithProperties extends InvestorLead {
  properties: LeadProperty[];
  propertyCount: number;
}
