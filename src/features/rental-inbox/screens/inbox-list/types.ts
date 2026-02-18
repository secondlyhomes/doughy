// src/features/rental-inbox/screens/inbox-list/types.ts
// Type definitions for InboxListScreen

import type { ConversationWithRelations, AIResponseQueueItem } from '@/stores/rental-conversations-store';

// Inbox mode types
export type InboxMode = 'leads' | 'residents';

export interface InboxModeOption {
  id: InboxMode;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  description: string;
}

// Extended conversation type for inbox with pending response
// hasPendingResponse comes from useFilteredInbox (always present)
// pendingResponse is added when conversation has a pending AI response
export type InboxConversation = ConversationWithRelations & {
  hasPendingResponse: boolean;
  pendingResponse?: AIResponseQueueItem;
};

// Section type for the sectioned inbox
export interface InboxSection {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  iconBgColor: string;
  description?: string;
  data: InboxConversation[];
}
