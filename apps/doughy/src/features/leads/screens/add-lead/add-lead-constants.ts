// Add Lead Screen - Constants & Types

import { LeadStatus } from '../../types';

export const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

export type LeadFieldName = 'name' | 'email' | 'phone' | 'company' | 'notes';
