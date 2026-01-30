// src/features/lead-inbox/screens/lead-inbox-list/types.ts
// Types for lead inbox list screen

import type { LeadConversationListItem } from '../../types';

export interface LeadInboxSection {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  iconBgColor: string;
  description?: string;
  data: LeadConversationListItem[];
}
