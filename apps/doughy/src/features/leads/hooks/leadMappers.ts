// src/features/leads/hooks/leadMappers.ts
// Mapper functions for converting database rows to Lead domain objects

import { Lead } from '../types';
import type { Database } from '@/integrations/supabase/types';

// Type alias for the crm_leads table row
export type CrmLeadRow = Database['public']['Tables']['crm_leads']['Row'];

// Pagination constants
export const PAGE_SIZE = 20;

// Map a database row to a Lead object
export function mapRowToLead(row: CrmLeadRow): Lead {
  // module exists in DB (NOT NULL, CHECK) but not in generated types yet — safe runtime access
  const rawModule = (row as Record<string, unknown>).module;
  const lead: Lead = {
    id: row.id,
    module: rawModule === 'investor' || rawModule === 'landlord' ? rawModule : 'investor',
    user_id: row.user_id ?? undefined,
    workspace_id: row.workspace_id ?? undefined,
    name: row.name || '',
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    company: row.company ?? undefined,
    status: (row.status as Lead['status']) || 'new',
    score: row.score ?? undefined,
    tags: row.tags || [],
    opt_status: (row.opt_status ?? undefined) as Lead['opt_status'],
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
  return lead;
}
