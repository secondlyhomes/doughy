// src/services/import/leadNormalizer.ts
// Lead data normalization utilities

import type { Lead, LeadFormData } from '@/types';
import { normalizeEmail } from './validation';

export function normalizeLeadData(data: Record<string, unknown>): LeadFormData | null {
  const firstName = data.first_name || data.firstName || data.name?.toString().split(' ')[0] || '';
  const lastName = data.last_name || data.lastName || data.name?.toString().split(' ').slice(1).join(' ') || '';
  const email = data.email || '';
  const phone = data.phone || data.phone_number || data.phoneNumber || '';

  if (!firstName) {
    return null;
  }

  const budgetMin = data.budget_min ? Number(data.budget_min) : undefined;
  const budgetMax = data.budget_max ? Number(data.budget_max) : undefined;

  return {
    first_name: String(firstName),
    last_name: lastName ? String(lastName) : undefined,
    email: email ? normalizeEmail(String(email)) : undefined,
    phone: phone ? String(phone) : undefined,
    source: normalizeSource(data.source),
    status: normalizeLeadStatus(data.status),
    priority: normalizePriority(data.priority),
    notes: data.notes ? String(data.notes) : undefined,
    budget_min: budgetMin !== undefined && !isNaN(budgetMin) ? budgetMin : undefined,
    budget_max: budgetMax !== undefined && !isNaN(budgetMax) ? budgetMax : undefined,
    preferred_location: data.preferred_location ? String(data.preferred_location) : undefined,
  };
}

export function normalizeSource(source: unknown): Lead['source'] {
  const s = String(source).toLowerCase();
  const sourceMap: Record<string, Lead['source']> = {
    website: 'website',
    web: 'website',
    referral: 'referral',
    ref: 'referral',
    social: 'social',
    facebook: 'social',
    instagram: 'social',
    linkedin: 'social',
    cold_call: 'cold_call',
    coldcall: 'cold_call',
    'cold call': 'cold_call',
    email: 'email',
    other: 'other',
  };
  return sourceMap[s] || 'other';
}

export function normalizeLeadStatus(status: unknown): Lead['status'] {
  const s = String(status).toLowerCase();
  const statusMap: Record<string, Lead['status']> = {
    new: 'new',
    contacted: 'contacted',
    qualified: 'qualified',
    proposal: 'proposal',
    negotiation: 'negotiation',
    closed_won: 'closed_won',
    'closed won': 'closed_won',
    won: 'closed_won',
    closed_lost: 'closed_lost',
    'closed lost': 'closed_lost',
    lost: 'closed_lost',
  };
  return statusMap[s] || 'new';
}

export function normalizePriority(priority: unknown): Lead['priority'] {
  const p = String(priority).toLowerCase();
  const priorityMap: Record<string, Lead['priority']> = {
    low: 'low',
    medium: 'medium',
    med: 'medium',
    high: 'high',
  };
  return priorityMap[p] || 'medium';
}
