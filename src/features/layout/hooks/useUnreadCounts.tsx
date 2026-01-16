// useUnreadCounts Hook - React Native
// Zone D: Track unread counts for tab badges using React Context
// Zone G: Added overdueDeals for deals tab badge

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface UnreadCounts {
  leads: number;
  conversations: number;
  notifications: number;
  overdueDeals: number; // Zone G: Deals with overdue actions
}

interface UnreadCountsContextValue {
  counts: UnreadCounts;
  markLeadsAsRead: (count?: number) => void;
  markConversationsAsRead: (count?: number) => void;
  markNotificationsAsRead: (count?: number) => void;
  incrementLeads: (count?: number) => void;
  incrementConversations: (count?: number) => void;
  incrementNotifications: (count?: number) => void;
  setOverdueDeals: (count: number) => void; // Zone G
  clearAllCounts: () => void;
}

const UnreadCountsContext = createContext<UnreadCountsContextValue | null>(null);

const DEFAULT_COUNTS: UnreadCounts = {
  leads: 3, // Mock: New leads
  conversations: 2, // Mock: Unread conversations
  notifications: 5, // Mock: Unread notifications
  overdueDeals: 2, // Mock: Overdue deal actions
};

interface UnreadCountsProviderProps {
  children: ReactNode;
  initialCounts?: UnreadCounts;
}

/**
 * Provider component for unread counts state
 * Wrap your app with this to enable useUnreadCounts hook
 */
export function UnreadCountsProvider({
  children,
  initialCounts = DEFAULT_COUNTS
}: UnreadCountsProviderProps) {
  const [counts, setCounts] = useState<UnreadCounts>(initialCounts);

  const markLeadsAsRead = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      leads: Math.max(0, prev.leads - count),
    }));
  }, []);

  const markConversationsAsRead = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      conversations: Math.max(0, prev.conversations - count),
    }));
  }, []);

  const markNotificationsAsRead = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      notifications: Math.max(0, prev.notifications - count),
    }));
  }, []);

  const incrementLeads = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      leads: prev.leads + count,
    }));
  }, []);

  const incrementConversations = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      conversations: prev.conversations + count,
    }));
  }, []);

  const incrementNotifications = useCallback((count = 1) => {
    setCounts(prev => ({
      ...prev,
      notifications: prev.notifications + count,
    }));
  }, []);

  // Zone G: Set overdue deals count
  const setOverdueDeals = useCallback((count: number) => {
    setCounts(prev => ({
      ...prev,
      overdueDeals: Math.max(0, count),
    }));
  }, []);

  const clearAllCounts = useCallback(() => {
    setCounts({ leads: 0, conversations: 0, notifications: 0, overdueDeals: 0 });
  }, []);

  const value = useMemo(() => ({
    counts,
    markLeadsAsRead,
    markConversationsAsRead,
    markNotificationsAsRead,
    incrementLeads,
    incrementConversations,
    incrementNotifications,
    setOverdueDeals,
    clearAllCounts,
  }), [
    counts,
    markLeadsAsRead,
    markConversationsAsRead,
    markNotificationsAsRead,
    incrementLeads,
    incrementConversations,
    incrementNotifications,
    setOverdueDeals,
    clearAllCounts,
  ]);

  return (
    <UnreadCountsContext.Provider value={value}>
      {children}
    </UnreadCountsContext.Provider>
  );
}

/**
 * Hook to get and manage unread counts for tab badges
 * Must be used within an UnreadCountsProvider
 */
export function useUnreadCounts(): UnreadCountsContextValue {
  const context = useContext(UnreadCountsContext);

  if (!context) {
    throw new Error('useUnreadCounts must be used within an UnreadCountsProvider');
  }

  return context;
}

/**
 * Format badge count for display
 * Returns undefined if count is 0 (hides badge)
 * Returns "99+" for counts over 99
 */
export function formatBadgeCount(count: number): string | undefined {
  if (count <= 0) return undefined;
  if (count > 99) return '99+';
  return count.toString();
}

export default useUnreadCounts;
