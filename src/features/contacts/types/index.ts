// src/features/contacts/types/index.ts
// Contact types for the Landlord platform CRM contacts
// Uses crm_contacts table for unified contact management

import type { Database } from '@/integrations/supabase/types';

// Type aliases from database schema
export type CrmContactType = Database['public']['Enums']['crm_contact_type'];
export type CrmContactStatus = Database['public']['Enums']['crm_contact_status'];
export type CrmContactSource = Database['public']['Enums']['crm_contact_source'];

// Contact types relevant for the Landlord platform
export const LANDLORD_CONTACT_TYPES: CrmContactType[] = ['lead', 'guest', 'tenant', 'vendor'];

// Contact interface matching crm_contacts table
export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  contact_types: CrmContactType[] | null;
  score: number | null;
  status: CrmContactStatus | null;
  source: CrmContactSource | null;
  company: string | null;
  job_title: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  is_deleted: boolean | null;
}

// Form data for creating/editing contacts
export interface ContactFormData {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  contact_types?: CrmContactType[];
  company?: string;
  job_title?: string;
  source?: CrmContactSource;
  status?: CrmContactStatus;
  notes?: string;
}

// Filter options for contacts list
export interface ContactFilters {
  contact_type: CrmContactType | 'all';
  status: CrmContactStatus | 'all';
  source: CrmContactSource | 'all';
  sortBy: 'name' | 'created_at' | 'score';
  sortOrder: 'asc' | 'desc';
}

// Helper to get display name for a contact
export function getContactDisplayName(contact: Contact): string {
  const parts = [contact.first_name, contact.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unnamed Contact';
}

// Helper to get initials for avatar
export function getContactInitials(contact: Contact): string {
  const first = contact.first_name?.[0] || '';
  const last = contact.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
}
