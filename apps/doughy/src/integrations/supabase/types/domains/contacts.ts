import type { Json } from '../common';
import type { SmsOptStatus } from '../constants';

export interface ContactsTable {
  Row: {
    address: Json | null
    company: string | null
    created_at: string
    email: string | null
    emails: Json | null
    first_name: string | null
    id: string
    is_deleted: boolean | null
    job_title: string | null
    last_name: string | null
    phone: string | null
    phones: Json | null
    sms_opt_status: SmsOptStatus | null
    updated_at: string
  }
  Insert: {
    address?: Json | null
    company?: string | null
    created_at?: string
    email?: string | null
    emails?: Json | null
    first_name?: string | null
    id?: string
    is_deleted?: boolean | null
    job_title?: string | null
    last_name?: string | null
    phone?: string | null
    phones?: Json | null
    sms_opt_status?: SmsOptStatus | null
    updated_at?: string
  }
  Update: {
    address?: Json | null
    company?: string | null
    created_at?: string
    email?: string | null
    emails?: Json | null
    first_name?: string | null
    id?: string
    is_deleted?: boolean | null
    job_title?: string | null
    last_name?: string | null
    phone?: string | null
    phones?: Json | null
    sms_opt_status?: SmsOptStatus | null
    updated_at?: string
  }
  Relationships: []
}
