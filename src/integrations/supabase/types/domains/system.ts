import type { Json } from '../common';

export interface SystemLogsTable {
  Row: {
    created_at: string
    details: Json | null
    id: string
    ip_address: string | null
    level: string
    message: string
    session_id: string | null
    source: string
    user_id: string | null
  }
  Insert: {
    created_at?: string
    details?: Json | null
    id?: string
    ip_address?: string | null
    level: string
    message: string
    session_id?: string | null
    source: string
    user_id?: string | null
  }
  Update: {
    created_at?: string
    details?: Json | null
    id?: string
    ip_address?: string | null
    level?: string
    message?: string
    session_id?: string | null
    source?: string
    user_id?: string | null
  }
  Relationships: []
}

export interface FeatureFlagsTable {
  Row: {
    code: string
    created_at: string | null
    description: string
    enabled_for_plan: string[] | null
  }
  Insert: {
    code: string
    created_at?: string | null
    description: string
    enabled_for_plan?: string[] | null
  }
  Update: {
    code?: string
    created_at?: string | null
    description?: string
    enabled_for_plan?: string[] | null
  }
  Relationships: []
}

export interface UsageLogsTable {
  Row: {
    cost_cents: number | null
    created_at: string | null
    id: string
    service: string
    tokens_used: number | null
    user_id: string | null
  }
  Insert: {
    cost_cents?: number | null
    created_at?: string | null
    id?: string
    service: string
    tokens_used?: number | null
    user_id?: string | null
  }
  Update: {
    cost_cents?: number | null
    created_at?: string | null
    id?: string
    service?: string
    tokens_used?: number | null
    user_id?: string | null
  }
  Relationships: []
}
