// src/features/lead-inbox/screens/lead-inbox-list/useLeadInboxSections.ts
// Hook that builds section list data from filtered conversations and pending responses

import { useMemo } from 'react';
import { MessageSquare, Sparkles, AlertCircle, Clock } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import type { LeadConversationListItem, InvestorAIQueueItem } from '../../types';
import type { LeadInboxSection } from './types';

export function useLeadInboxSections(
  filteredConversations: LeadConversationListItem[],
  pendingResponses: InvestorAIQueueItem[],
  activeFilter: string,
  debouncedSearch: string,
): LeadInboxSection[] {
  const colors = useThemeColors();

  return useMemo(() => {
    if (activeFilter !== 'all' || debouncedSearch) {
      return [
        {
          title: activeFilter === 'ai_waiting' ? 'AI Waiting Approval' : 'Conversations',
          icon: MessageSquare,
          iconColor: colors.foreground,
          iconBgColor: colors.muted,
          data: filteredConversations,
        },
      ];
    }

    // Create pending map for quick lookup
    const pendingMap = new Map(
      pendingResponses.map((p) => [p.conversation_id, p])
    );

    // Categorize conversations
    const aiWaiting: LeadConversationListItem[] = [];
    const needsResponse: LeadConversationListItem[] = [];
    const recent: LeadConversationListItem[] = [];

    filteredConversations.forEach((conv) => {
      const pending = pendingMap.get(conv.id);

      if (pending) {
        // Spread conv and add the pending response (types are compatible after narrowing)
        aiWaiting.push({ ...conv, pendingResponse: pending });
      } else if (conv.unread_count > 0) {
        needsResponse.push(conv);
      } else {
        recent.push(conv);
      }
    });

    const result: LeadInboxSection[] = [];

    if (aiWaiting.length > 0) {
      result.push({
        title: 'AI Waiting Approval',
        icon: Sparkles,
        iconColor: colors.warning,
        iconBgColor: withOpacity(colors.warning, 'light'),
        description: 'Review and approve AI responses',
        data: aiWaiting,
      });
    }

    if (needsResponse.length > 0) {
      result.push({
        title: 'Needs Response',
        icon: AlertCircle,
        iconColor: colors.destructive,
        iconBgColor: withOpacity(colors.destructive, 'light'),
        description: 'Leads waiting for your reply',
        data: needsResponse,
      });
    }

    if (recent.length > 0) {
      result.push({
        title: 'Recent',
        icon: Clock,
        iconColor: colors.info,
        iconBgColor: withOpacity(colors.info, 'light'),
        data: recent,
      });
    }

    return result;
  }, [filteredConversations, pendingResponses, activeFilter, debouncedSearch, colors]);
}
