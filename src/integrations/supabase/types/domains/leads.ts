import type { Json } from '../common';
import type { LeadStatus, SmsOptStatus } from '../constants';

export interface LeadsTable {
  Row: {
    company: string | null
    created_at: string | null
    email: string | null
    id: string
    is_deleted: boolean | null
    name: string
    opt_status: SmsOptStatus | null
    phone: string | null
    score: number | null
    status: LeadStatus
    tags: string[] | null
    updated_at: string
    workspace_id: string | null
  }
  Insert: {
    company?: string | null
    created_at?: string | null
    email?: string | null
    id?: string
    is_deleted?: boolean | null
    name: string
    opt_status?: SmsOptStatus | null
    phone?: string | null
    score?: number | null
    status?: LeadStatus
    tags?: string[] | null
    updated_at?: string
    workspace_id?: string | null
  }
  Update: {
    company?: string | null
    created_at?: string | null
    email?: string | null
    id?: string
    is_deleted?: boolean | null
    name?: string
    opt_status?: SmsOptStatus | null
    phone?: string | null
    score?: number | null
    status?: LeadStatus
    tags?: string[] | null
    updated_at?: string
    workspace_id?: string | null
  }
  Relationships: []
}

export interface LeadContactsTable {
  Row: {
    contact_id: string
    created_at: string
    id: string
    is_primary: boolean | null
    lead_id: string
    role: string | null
    updated_at: string
  }
  Insert: {
    contact_id: string
    created_at?: string
    id?: string
    is_primary?: boolean | null
    lead_id: string
    role?: string | null
    updated_at?: string
  }
  Update: {
    contact_id?: string
    created_at?: string
    id?: string
    is_primary?: boolean | null
    lead_id?: string
    role?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "lead_contacts_contact_id_fkey"
      columns: ["contact_id"]
      isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "lead_contacts_lead_id_fkey"
      columns: ["lead_id"]
      isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
  ]
}
