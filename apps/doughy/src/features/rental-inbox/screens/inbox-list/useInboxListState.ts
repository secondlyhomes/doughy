// src/features/rental-inbox/screens/inbox-list/useInboxListState.ts
// State management hook for InboxListScreen
// Encapsulates filtering, sorting, sectioning, and event handlers

import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, UserPlus } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useDebounce } from '@/hooks';

import { useInbox, useFilteredInbox } from '../../hooks/useInbox';
import type { ConversationWithRelations } from '@/stores/rental-conversations-store';
import type { InboxFilter, InboxSort } from '../../types';
import type { InboxMode, InboxSection, InboxConversation } from './types';

export function useInboxListState() {
  const router = useRouter();
  const colors = useThemeColors();

  // State
  const [inboxMode, setInboxMode] = useState<InboxMode>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const [activeSort, setActiveSort] = useState<InboxSort>('pending_first');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Data hooks
  const { pendingCount, pendingResponses, isLoading, isRefreshing, error, subscriptionError, refresh, quickApprove, clearError } = useInbox();
  const allConversations = useFilteredInbox(activeFilter, activeSort, debouncedSearch);

  // Filter conversations by mode (leads vs residents)
  const filteredConversations = useMemo(() => {
    return allConversations.filter((conv) => {
      const isLead = conv.contact?.contact_types?.includes('lead');
      if (inboxMode === 'leads') {
        // Show leads and new inquiries (contacts without type or with lead type)
        return isLead || !conv.contact?.contact_types?.length;
      } else {
        // Show residents (guests, tenants - anyone not primarily a lead)
        return !isLead && conv.contact?.contact_types?.length;
      }
    });
  }, [allConversations, inboxMode]);

  // Count for each mode (for badges)
  const modeCounts = useMemo(() => {
    let leads = 0;
    let residents = 0;
    allConversations.forEach((conv) => {
      const isLead = conv.contact?.contact_types?.includes('lead');
      if (isLead || !conv.contact?.contact_types?.length) {
        leads++;
      } else {
        residents++;
      }
    });
    return { leads, residents };
  }, [allConversations]);

  // Create sections from conversations
  const sections: InboxSection[] = useMemo(() => {
    if (activeFilter !== 'all' || debouncedSearch) {
      // When filtered or searching, show flat list
      return [
        {
          title: activeFilter === 'needs_review' ? 'Needs Review' : 'Conversations',
          icon: MessageSquare,
          iconColor: colors.foreground,
          iconBgColor: colors.muted,
          data: filteredConversations as InboxConversation[],
        },
      ];
    }

    // Create pending map for quick lookup
    const pendingMap = new Map(
      pendingResponses.map((p) => [p.conversation_id, p])
    );

    // Categorize conversations
    const newLeads: InboxConversation[] = [];
    const needsReview: InboxConversation[] = [];
    const otherActive: InboxConversation[] = [];

    filteredConversations.forEach((conv) => {
      const pending = pendingMap.get(conv.id);
      const isLead = conv.contact?.contact_types?.includes('lead');

      if (pending) {
        // Has pending AI response
        if (isLead) {
          newLeads.push({ ...conv, pendingResponse: pending, hasPendingResponse: true });
        } else {
          needsReview.push({ ...conv, pendingResponse: pending, hasPendingResponse: true });
        }
      } else if (conv.status === 'active') {
        // Check if recently AI-handled (last message was AI)
        // For now, just add to active
        otherActive.push(conv as InboxConversation);
      } else {
        otherActive.push(conv as InboxConversation);
      }
    });

    const result: InboxSection[] = [];

    if (newLeads.length > 0) {
      result.push({
        title: 'New Leads',
        icon: UserPlus,
        iconColor: colors.success,
        iconBgColor: withOpacity(colors.success, 'light'),
        description: 'AI responded - follow up recommended',
        data: newLeads,
      });
    }

    if (needsReview.length > 0) {
      result.push({
        title: 'Needs Your Review',
        icon: MessageSquare,
        iconColor: colors.warning,
        iconBgColor: withOpacity(colors.warning, 'light'),
        description: 'AI responses waiting for approval',
        data: needsReview,
      });
    }

    if (otherActive.length > 0) {
      result.push({
        title: 'Active Conversations',
        icon: MessageSquare,
        iconColor: colors.info,
        iconBgColor: withOpacity(colors.info, 'light'),
        data: otherActive,
      });
    }

    return result;
  }, [filteredConversations, pendingResponses, activeFilter, debouncedSearch, colors]);

  // Event handlers
  const handleConversationPress = useCallback(
    (conversation: ConversationWithRelations) => {
      router.push(`/(tabs)/landlord-inbox/${conversation.id}`);
    },
    [router]
  );

  const handleQuickApprove = useCallback(
    async (conversationId: string) => {
      const pending = pendingResponses.find((p) => p.conversation_id === conversationId);
      if (!pending) {
        // Provide user feedback when pending response not found (may have been processed)
        Alert.alert('Already Processed', 'This response has already been approved or expired.');
        return;
      }

      try {
        const success = await quickApprove(pending.id);
        if (!success) {
          Alert.alert('Approval Failed', 'Could not approve this response. It may have expired.');
        }
      } catch (err) {
        console.error('[InboxListScreen] Quick approve error:', err);
        Alert.alert('Error', 'Failed to approve response. Please try again.');
      }
    },
    [quickApprove, pendingResponses]
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setActiveFilter('all');
    setActiveSort('pending_first');
    setSearchQuery('');
  }, []);

  // Check if filters are active
  const hasActiveFilters = activeFilter !== 'all' || activeSort !== 'pending_first';

  return {
    // State
    inboxMode,
    setInboxMode,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    activeSort,
    setActiveSort,
    showFiltersSheet,
    setShowFiltersSheet,

    // Data
    pendingCount,
    isLoading,
    isRefreshing,
    error,
    subscriptionError,
    filteredConversations,
    modeCounts,
    sections,
    colors,
    hasActiveFilters,

    // Handlers
    handleConversationPress,
    handleQuickApprove,
    handleRefresh,
    handleClearFilters,
    clearError,
  };
}
