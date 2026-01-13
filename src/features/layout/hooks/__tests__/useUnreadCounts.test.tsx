// Tests for useUnreadCounts hook
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  UnreadCountsProvider,
  useUnreadCounts,
  formatBadgeCount,
} from '../useUnreadCounts';

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UnreadCountsProvider>{children}</UnreadCountsProvider>
);

const customWrapper = (initialCounts: { leads: number; conversations: number; notifications: number }) =>
  ({ children }: { children: React.ReactNode }) => (
    <UnreadCountsProvider initialCounts={initialCounts}>{children}</UnreadCountsProvider>
  );

describe('useUnreadCounts', () => {
  describe('hook functionality', () => {
    it('should return default counts', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      expect(result.current.counts).toEqual({
        leads: 3,
        conversations: 2,
        notifications: 5,
      });
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUnreadCounts());
      }).toThrow('useUnreadCounts must be used within an UnreadCountsProvider');

      consoleSpy.mockRestore();
    });

    it('should use custom initial counts', () => {
      const customCounts = { leads: 10, conversations: 5, notifications: 0 };
      const { result } = renderHook(() => useUnreadCounts(), {
        wrapper: customWrapper(customCounts),
      });

      expect(result.current.counts).toEqual(customCounts);
    });
  });

  describe('markLeadsAsRead', () => {
    it('should decrement leads count by 1 by default', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markLeadsAsRead();
      });

      expect(result.current.counts.leads).toBe(2);
    });

    it('should decrement leads count by specified amount', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markLeadsAsRead(2);
      });

      expect(result.current.counts.leads).toBe(1);
    });

    it('should not go below 0', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markLeadsAsRead(100);
      });

      expect(result.current.counts.leads).toBe(0);
    });
  });

  describe('markConversationsAsRead', () => {
    it('should decrement conversations count', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markConversationsAsRead();
      });

      expect(result.current.counts.conversations).toBe(1);
    });

    it('should not go below 0', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markConversationsAsRead(100);
      });

      expect(result.current.counts.conversations).toBe(0);
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should decrement notifications count', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.markNotificationsAsRead(3);
      });

      expect(result.current.counts.notifications).toBe(2);
    });
  });

  describe('incrementLeads', () => {
    it('should increment leads count by 1 by default', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.incrementLeads();
      });

      expect(result.current.counts.leads).toBe(4);
    });

    it('should increment leads count by specified amount', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.incrementLeads(5);
      });

      expect(result.current.counts.leads).toBe(8);
    });
  });

  describe('incrementConversations', () => {
    it('should increment conversations count', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.incrementConversations(3);
      });

      expect(result.current.counts.conversations).toBe(5);
    });
  });

  describe('incrementNotifications', () => {
    it('should increment notifications count', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.incrementNotifications();
      });

      expect(result.current.counts.notifications).toBe(6);
    });
  });

  describe('clearAllCounts', () => {
    it('should reset all counts to 0', () => {
      const { result } = renderHook(() => useUnreadCounts(), { wrapper });

      act(() => {
        result.current.clearAllCounts();
      });

      expect(result.current.counts).toEqual({
        leads: 0,
        conversations: 0,
        notifications: 0,
      });
    });
  });
});

describe('formatBadgeCount', () => {
  it('should return undefined for 0', () => {
    expect(formatBadgeCount(0)).toBeUndefined();
  });

  it('should return undefined for negative numbers', () => {
    expect(formatBadgeCount(-1)).toBeUndefined();
    expect(formatBadgeCount(-100)).toBeUndefined();
  });

  it('should return string for numbers 1-99', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(50)).toBe('50');
    expect(formatBadgeCount(99)).toBe('99');
  });

  it('should return "99+" for numbers over 99', () => {
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(999)).toBe('99+');
    expect(formatBadgeCount(10000)).toBe('99+');
  });
});
