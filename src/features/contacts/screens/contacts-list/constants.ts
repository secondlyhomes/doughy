// src/features/contacts/screens/contacts-list/constants.ts
// Filter configuration constants for contacts list

import type { CrmContactType, CrmContactStatus, CrmContactSource, ContactFilters } from '../../types';

export const DEFAULT_FILTERS: ContactFilters = {
  contact_type: 'all',
  status: 'all',
  source: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const CONTACT_TYPE_FILTERS: { key: CrmContactType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'guest', label: 'Guests' },
  { key: 'tenant', label: 'Tenants' },
  { key: 'vendor', label: 'Vendors' },
];

export const STATUS_OPTIONS: { label: string; value: CrmContactStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

export const SOURCE_OPTIONS: { label: string; value: CrmContactSource | 'all' }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Furnished Finder', value: 'furnishedfinder' },
  { label: 'Airbnb', value: 'airbnb' },
  { label: 'TurboTenant', value: 'turbotenant' },
  { label: 'Zillow', value: 'zillow' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Direct', value: 'direct' },
  { label: 'Referral', value: 'referral' },
  { label: 'Craigslist', value: 'craigslist' },
  { label: 'Other', value: 'other' },
];

export const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'score' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Score', value: 'score' },
];
