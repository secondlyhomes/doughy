// src/features/leads/screens/leads-list/constants.ts
// Constants for leads list screen

import type { LeadStatus } from '../../types';
import type { LeadFilters } from './types';

export const defaultFilters: LeadFilters = {
  status: 'all',
  source: 'all',
  starred: null,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const QUICK_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'active', label: 'Active' },
  { key: 'won', label: 'Won' },
  { key: 'starred', label: 'Starred' },
];

export const STATUS_OPTIONS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

export const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Direct Mail', value: 'direct_mail' },
  { label: 'Paid Ad', value: 'paid_ad' },
  { label: 'Other', value: 'other' },
];

export const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'score' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Lead Score', value: 'score' },
];
