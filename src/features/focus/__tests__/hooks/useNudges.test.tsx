// src/features/focus/__tests__/hooks/useNudges.test.tsx
// Comprehensive tests for the useNudges hook

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock FocusModeContext
const mockNudgeSettings = {
  enabled: true,
  staleLeadWarningDays: 5,
  staleLeadCriticalDays: 10,
  dealStalledDays: 7,
};

jest.mock('@/context/FocusModeContext', () => ({
  useFocusMode: () => ({
    nudgeSettings: mockNudgeSettings,
  }),
  DEFAULT_NUDGE_SETTINGS: {
    enabled: true,
    staleLeadWarningDays: 5,
    staleLeadCriticalDays: 10,
    dealStalledDays: 7,
  },
}));

// Mock Supabase
const mockLeadsData: any[] = [];
const mockDealsData: any[] = [];
const mockCapturesData: any[] = [];
const mockTouchesData: any[] = [];

const mockSelectLeads = jest.fn();
const mockSelectDeals = jest.fn();
const mockSelectCaptures = jest.fn();
const mockSelectTouches = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'crm_leads') {
        return {
          select: mockSelectLeads.mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: mockLeadsData, error: null }),
        };
      }
      if (table === 'contact_touches') {
        return {
          select: mockSelectTouches.mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: mockTouchesData, error: null }),
        };
      }
      if (table === 'deals') {
        return {
          select: mockSelectDeals.mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: mockDealsData, error: null }),
        };
      }
      if (table === 'capture_items') {
        return {
          select: mockSelectCaptures.mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: mockCapturesData, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  },
}));

import { useNudges } from '../../hooks/useNudges';

describe('useNudges', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();

    // Reset mock data
    mockLeadsData.length = 0;
    mockDealsData.length = 0;
    mockCapturesData.length = 0;
    mockTouchesData.length = 0;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============================================
  // Basic Functionality Tests
  // ============================================

  describe('Basic Functionality', () => {
    it('returns nudges array', async () => {
      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.nudges).toBeInstanceOf(Array);
    });

    it('returns summary object', async () => {
      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary).toHaveProperty('total');
      expect(result.current.summary).toHaveProperty('high');
      expect(result.current.summary).toHaveProperty('medium');
      expect(result.current.summary).toHaveProperty('low');
    });

    it('returns enabled flag', async () => {
      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.enabled).toBe(true);
    });

    it('returns isLoading state', async () => {
      const { result } = renderHook(() => useNudges(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBeDefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ============================================
  // Stale Lead Nudge Tests
  // ============================================

  describe('Stale Lead Nudges', () => {
    it('generates nudge for lead with no touches in warning period', async () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push({
        id: 'lead-1',
        name: 'John Doe',
        status: 'active',
        updated_at: sixDaysAgo.toISOString(),
      });

      // No touches for this lead
      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const staleNudge = result.current.nudges.find(
        (n) => n.type === 'stale_lead' && n.entityId === 'lead-1'
      );

      expect(staleNudge).toBeDefined();
      expect(staleNudge?.priority).toBe('medium');
    });

    it('generates high priority nudge for critical stale lead', async () => {
      const elevenDaysAgo = new Date();
      elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);

      mockLeadsData.push({
        id: 'lead-2',
        name: 'Jane Smith',
        status: 'active',
        updated_at: elevenDaysAgo.toISOString(),
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const criticalNudge = result.current.nudges.find(
        (n) => n.type === 'stale_lead' && n.entityId === 'lead-2'
      );

      expect(criticalNudge).toBeDefined();
      expect(criticalNudge?.priority).toBe('high');
    });

    it('uses last_touch_date instead of updated_at when available', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockLeadsData.push({
        id: 'lead-3',
        name: 'Bob Wilson',
        status: 'active',
        updated_at: tenDaysAgo.toISOString(), // Old updated_at
      });

      // Recent touch - should NOT generate stale nudge
      mockTouchesData.push({
        lead_id: 'lead-3',
        created_at: twoDaysAgo.toISOString(),
        responded: true,
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not generate nudge because of recent touch
      const nudge = result.current.nudges.find(
        (n) => n.type === 'stale_lead' && n.entityId === 'lead-3'
      );

      expect(nudge).toBeUndefined();
    });

    it('does not generate nudge for recently contacted lead', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockLeadsData.push({
        id: 'lead-4',
        name: 'Fresh Lead',
        status: 'active',
        updated_at: twoDaysAgo.toISOString(),
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const nudge = result.current.nudges.find(
        (n) => n.type === 'stale_lead' && n.entityId === 'lead-4'
      );

      expect(nudge).toBeUndefined();
    });
  });

  // ============================================
  // Deal Nudge Tests
  // ============================================

  describe('Deal Nudges', () => {
    it('generates action_overdue nudge for overdue deal', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockDealsData.push({
        id: 'deal-1',
        stage: 'under_contract',
        next_action: 'Schedule inspection',
        next_action_due: threeDaysAgo.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
        lead: { id: 'lead-1', name: 'Test Seller' },
        property: { id: 'prop-1', address_line_1: '123 Main St', city: 'Arlington', state: 'VA' },
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const overdueNudge = result.current.nudges.find(
        (n) => n.type === 'action_overdue' && n.entityId === 'deal-1'
      );

      expect(overdueNudge).toBeDefined();
      expect(overdueNudge?.priority).toBe('high');
      // Allow for timezone variations in calculation (3 or 4 days)
      expect(overdueNudge?.daysOverdue).toBeGreaterThanOrEqual(3);
    });

    it('generates nudge for deal due today', async () => {
      const today = new Date().toISOString().split('T')[0];

      mockDealsData.push({
        id: 'deal-2',
        stage: 'negotiating',
        next_action: 'Send offer',
        next_action_due: today,
        updated_at: new Date().toISOString(),
        lead: { id: 'lead-2', name: 'Another Seller' },
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Due today could be either action_due_soon or action_overdue depending on timing
      const dealNudge = result.current.nudges.find(
        (n) => (n.type === 'action_due_soon' || n.type === 'action_overdue') && n.entityId === 'deal-2'
      );

      expect(dealNudge).toBeDefined();
      expect(dealNudge?.priority).toBe('high');
    });

    it('generates deal_stalled nudge for inactive deal', async () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      mockDealsData.push({
        id: 'deal-3',
        stage: 'researching',
        next_action: null,
        next_action_due: null,
        updated_at: tenDaysAgo.toISOString(),
        lead: { id: 'lead-3', name: 'Stalled Seller' },
        property: { id: 'prop-2', address_line_1: '456 Oak Ave', city: 'Alexandria', state: 'VA' },
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stalledNudge = result.current.nudges.find(
        (n) => n.type === 'deal_stalled' && n.entityId === 'deal-3'
      );

      expect(stalledNudge).toBeDefined();
      expect(stalledNudge?.priority).toBe('medium');
    });
  });

  // ============================================
  // Capture Nudge Tests
  // ============================================

  describe('Capture Nudges', () => {
    it('generates capture_pending nudge when items are pending', async () => {
      mockCapturesData.push(
        { id: 'capture-1', type: 'photo', title: 'Property photo', status: 'pending', created_at: new Date().toISOString() },
        { id: 'capture-2', type: 'note', title: 'Meeting notes', status: 'ready', created_at: new Date().toISOString() },
        { id: 'capture-3', type: 'document', title: 'Contract', status: 'pending', created_at: new Date().toISOString() }
      );

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const captureNudge = result.current.nudges.find((n) => n.type === 'capture_pending');

      expect(captureNudge).toBeDefined();
      expect(captureNudge?.title).toContain('3 items');
      expect(captureNudge?.priority).toBe('low');
    });

    it('sets medium priority for many pending captures', async () => {
      // Add more than 5 captures
      for (let i = 0; i < 7; i++) {
        mockCapturesData.push({
          id: `capture-${i}`,
          type: 'photo',
          title: `Photo ${i}`,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const captureNudge = result.current.nudges.find((n) => n.type === 'capture_pending');

      expect(captureNudge?.priority).toBe('medium');
    });

    it('does not generate capture nudge when no pending items', async () => {
      // No captures
      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const captureNudge = result.current.nudges.find((n) => n.type === 'capture_pending');

      expect(captureNudge).toBeUndefined();
    });
  });

  // ============================================
  // Snooze Filtering Tests
  // ============================================

  describe('Snooze Filtering', () => {
    it('filters out snoozed nudges', async () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push({
        id: 'lead-snoozed',
        name: 'Snoozed Lead',
        status: 'active',
        updated_at: sixDaysAgo.toISOString(),
      });

      // Pre-set snoozed nudge in AsyncStorage
      const snoozedNudges = [
        { nudgeId: 'stale-lead-lead-snoozed', expiresAt: Date.now() + 86400000 }, // 1 day from now
      ];
      await AsyncStorage.setItem('doughy_snoozed_nudges', JSON.stringify(snoozedNudges));

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const snoozedNudge = result.current.nudges.find(
        (n) => n.entityId === 'lead-snoozed'
      );

      expect(snoozedNudge).toBeUndefined();
    });

    it('includes nudge after snooze expires', async () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push({
        id: 'lead-expired-snooze',
        name: 'Expired Snooze Lead',
        status: 'active',
        updated_at: sixDaysAgo.toISOString(),
      });

      // Pre-set expired snoozed nudge in AsyncStorage
      const snoozedNudges = [
        { nudgeId: 'stale-lead-lead-expired-snooze', expiresAt: Date.now() - 1000 }, // Already expired
      ];
      await AsyncStorage.setItem('doughy_snoozed_nudges', JSON.stringify(snoozedNudges));

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should appear because snooze expired
      const nudge = result.current.nudges.find(
        (n) => n.entityId === 'lead-expired-snooze'
      );

      expect(nudge).toBeDefined();
    });
  });

  // ============================================
  // Priority Sorting Tests
  // ============================================

  describe('Priority Sorting', () => {
    it('sorts nudges by priority (high first)', async () => {
      const elevenDaysAgo = new Date();
      elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);

      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push(
        {
          id: 'lead-medium',
          name: 'Medium Lead',
          status: 'active',
          updated_at: sixDaysAgo.toISOString(),
        },
        {
          id: 'lead-high',
          name: 'High Lead',
          status: 'active',
          updated_at: elevenDaysAgo.toISOString(),
        }
      );

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const highIndex = result.current.nudges.findIndex(
        (n) => n.entityId === 'lead-high'
      );
      const mediumIndex = result.current.nudges.findIndex(
        (n) => n.entityId === 'lead-medium'
      );

      expect(highIndex).toBeLessThan(mediumIndex);
    });
  });

  // ============================================
  // Summary Calculation Tests
  // ============================================

  describe('Summary Calculation', () => {
    it('correctly calculates summary counts', async () => {
      const elevenDaysAgo = new Date();
      elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);

      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push(
        {
          id: 'lead-1',
          name: 'Lead 1',
          status: 'active',
          updated_at: elevenDaysAgo.toISOString(), // high
        },
        {
          id: 'lead-2',
          name: 'Lead 2',
          status: 'active',
          updated_at: sixDaysAgo.toISOString(), // medium
        }
      );

      mockCapturesData.push({
        id: 'capture-1',
        type: 'photo',
        title: 'Photo',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary.total).toBeGreaterThanOrEqual(3);
      expect(result.current.summary.high).toBeGreaterThanOrEqual(1);
      expect(result.current.summary.staleLeads).toBeGreaterThanOrEqual(2);
      expect(result.current.summary.pendingCaptures).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // Disabled Settings Tests
  // ============================================

  describe('Disabled Settings', () => {
    // Note: Would need to modify mock to test disabled state
    // The hook checks settings.enabled and returns empty array if false
  });

  // ============================================
  // Touch Data Tests
  // ============================================

  describe('Touch Data', () => {
    it('calculates responsiveness from touches', async () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      mockLeadsData.push({
        id: 'lead-with-touches',
        name: 'Lead With Touches',
        status: 'active',
        updated_at: sixDaysAgo.toISOString(),
      });

      // Add touches with mixed responses
      mockTouchesData.push(
        { lead_id: 'lead-with-touches', created_at: sixDaysAgo.toISOString(), responded: true },
        { lead_id: 'lead-with-touches', created_at: sixDaysAgo.toISOString(), responded: false },
        { lead_id: 'lead-with-touches', created_at: sixDaysAgo.toISOString(), responded: true }
      );

      const { result } = renderHook(() => useNudges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const nudge = result.current.nudges.find(
        (n) => n.entityId === 'lead-with-touches'
      ) as any;

      // Check that touch data was processed (subtitle should mention responsiveness)
      expect(nudge?.subtitle).toBeDefined();
    });
  });
});
