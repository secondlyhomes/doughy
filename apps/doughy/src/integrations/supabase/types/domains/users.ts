
import type { Json } from '../common';
import type { UserRole, PlanTier } from '../constants';

export interface ProfilesTable {
  Row: {
    created_at: string | null
    email: string
    id: string
    role: UserRole
    workspace_id?: string | null  // Make workspace_id optional with nullable type
  }
  Insert: {
    created_at?: string | null
    email: string
    id: string
    role?: UserRole
    workspace_id?: string | null
  }
  Update: {
    created_at?: string | null
    email?: string
    id?: string
    role?: UserRole
    workspace_id?: string | null
  }
  Relationships: []
}

export interface UserPlansTable {
  Row: {
    email_domain: string | null
    last_login: string | null
    monthly_token_cap: number | null
    status: string | null
    tier: PlanTier | null
    user_id: string
    trial_ends_at: string | null
  }
  Insert: {
    email_domain?: string | null
    last_login?: string | null
    monthly_token_cap?: number | null
    status?: string | null
    tier?: PlanTier | null
    user_id: string
    trial_ends_at?: string | null
  }
  Update: {
    email_domain?: string | null
    last_login?: string | null
    monthly_token_cap?: number | null
    status?: string | null
    tier?: PlanTier | null
    user_id?: string
    trial_ends_at?: string | null
  }
  Relationships: []
}

export interface RateLimitsTable {
  Row: {
    created_at: string
    id: string
    last_reset: string
    request_type: string
    requests_count: number
    updated_at: string
    user_id: string
  }
  Insert: {
    created_at?: string
    id?: string
    last_reset?: string
    request_type: string
    requests_count?: number
    updated_at?: string
    user_id: string
  }
  Update: {
    created_at?: string
    id?: string
    last_reset?: string
    request_type?: string
    requests_count?: number
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}

export interface ApiKeysTable {
  Row: {
    created_at: string | null
    description: string | null
    id: string
    key_ciphertext: string
    last_checked: string | null
    last_used: string | null
    service: string
    status: string | null
    updated_at: string | null
    user_id: string | null
  }
  Insert: {
    created_at?: string | null
    description?: string | null
    id?: string
    key_ciphertext: string
    last_checked?: string | null
    last_used?: string | null
    service: string
    status?: string | null
    updated_at?: string | null
    user_id?: string | null
  }
  Update: {
    created_at?: string | null
    description?: string | null
    id?: string
    key_ciphertext?: string
    last_checked?: string | null
    last_used?: string | null
    service?: string
    status?: string | null
    updated_at?: string | null
    user_id?: string | null
  }
  Relationships: []
}
