// src/features/lead-inbox/screens/lead-inbox-list/constants.ts
// Constants for lead inbox list screen

import { MessageSquare, AlertCircle, Sparkles, Check } from 'lucide-react-native';
import type { LeadInboxFilter, LeadInboxSort } from '../../types';

export const FILTER_OPTIONS: {
  key: LeadInboxFilter;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}[] = [
  { key: 'all', label: 'All', icon: MessageSquare },
  { key: 'ai_waiting', label: 'AI Waiting', icon: Sparkles },
  { key: 'needs_response', label: 'Needs Response', icon: AlertCircle },
  { key: 'resolved', label: 'Resolved', icon: Check },
];

export const SORT_OPTIONS: { key: LeadInboxSort; label: string }[] = [
  { key: 'pending_first', label: 'Pending First' },
  { key: 'recent', label: 'Most Recent' },
  { key: 'unread_first', label: 'Unread First' },
  { key: 'oldest', label: 'Oldest First' },
];
