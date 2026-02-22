// src/features/rental-inbox/screens/inbox-list/constants.ts
// Constants for InboxListScreen

import { MessageSquare, AlertCircle, Clock, UserPlus, Home } from 'lucide-react-native';
import type { InboxFilter, InboxSort } from '../../types';
import type { InboxModeOption } from './types';

export const SEGMENT_CONTROL_HEIGHT = 38; // Inner content height (excludes 3px padding on each side)

export const INBOX_MODES: InboxModeOption[] = [
  { id: 'leads', label: 'Leads', icon: UserPlus, description: 'New inquiries & prospecting' },
  { id: 'residents', label: 'Residents', icon: Home, description: 'Current tenants & guests' },
];

export const FILTER_OPTIONS: { key: InboxFilter; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: 'all', label: 'All', icon: MessageSquare },
  { key: 'needs_review', label: 'Needs Review', icon: AlertCircle },
  { key: 'archived', label: 'Archived', icon: Clock },
];

export const SORT_OPTIONS: { key: InboxSort; label: string }[] = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'pending_first', label: 'Pending First' },
  { key: 'oldest', label: 'Oldest First' },
];
