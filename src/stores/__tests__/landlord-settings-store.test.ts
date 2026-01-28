// src/stores/__tests__/landlord-settings-store.test.ts
// Comprehensive tests for the landlord settings Zustand store

import { act } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import {
  useLandlordSettingsStore,
  selectAIMode,
  selectConfidenceThreshold,
  selectAlwaysReviewTopics,
  selectResponseStyle,
  selectNotificationPreferences,
  selectAIPersonality,
  selectLeadSettings,
  selectIsLandlordEnabled,
  selectActivePlatform,
  selectHasCompletedOnboarding,
  selectEffectiveThreshold,
  selectTopicRequiresReview,
  type LandlordSettings,
  type UserPlatformSettings,
  type AIMode,
} from '../landlord-settings-store';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useLandlordSettingsStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    const store = useLandlordSettingsStore.getState();
    store.reset();
  });

  // ============================================
  // Mock Data
  // ============================================

  const mockLandlordSettings: LandlordSettings = {
    ai_mode: 'assisted',
    ai_auto_respond: true,
    confidence_threshold: 85,
    always_review_topics: ['refund', 'discount', 'complaint', 'cancellation', 'damage', 'security_deposit'],
    notify_for_contact_types: ['lead'],
    response_style: 'friendly',
    notifications: {
      new_leads: true,
      ai_needs_review: true,
      booking_requests: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
    },
    ai_personality: {
      use_emojis: false,
      greeting_style: 'Hi {first_name}!',
      sign_off: 'Best',
      owner_name: null,
    },
    learning: {
      enabled: true,
      min_samples_for_auto_adjust: 10,
      recalculate_frequency_days: 7,
    },
    lead_settings: {
      fast_response_enabled: true,
      lead_confidence_threshold: 70,
      always_notify_on_lead_response: true,
      auto_score_leads: true,
    },
    templates: {
      use_custom_templates: true,
      ai_can_suggest_templates: true,
    },
  };

  const mockPlatformSettings: UserPlatformSettings = {
    id: 'settings-1',
    user_id: 'user-1',
    enabled_platforms: ['investor', 'landlord'],
    active_platform: 'landlord',
    completed_investor_onboarding: true,
    completed_landlord_onboarding: true,
    landlord_settings: mockLandlordSettings,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockUser = { id: 'user-1', email: 'test@example.com' };

  // ============================================
  // Initial State Tests
  // ============================================

  describe('Initial State', () => {
    it('starts with null platformSettings', () => {
      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings).toBeNull();
    });

    it('starts with default landlord settings', () => {
      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.ai_mode).toBe('assisted');
      expect(state.landlordSettings.confidence_threshold).toBe(85);
      expect(state.landlordSettings.always_review_topics).toContain('refund');
    });

    it('starts with loading states as false', () => {
      const state = useLandlordSettingsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it('starts with null error', () => {
      const state = useLandlordSettingsStore.getState();
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // fetchSettings Tests
  // ============================================

  describe('fetchSettings', () => {
    it('fetches and sets platform settings on success', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: mockPlatformSettings,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.fetchSettings();
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings).not.toBeNull();
      expect(state.platformSettings?.active_platform).toBe('landlord');
      expect(state.landlordSettings.ai_mode).toBe('assisted');
      expect(state.isLoading).toBe(false);
    });

    it('sets isLoading while fetching', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const store = useLandlordSettingsStore.getState();

      act(() => {
        store.fetchSettings();
      });

      const stateWhileLoading = useLandlordSettingsStore.getState();
      expect(stateWhileLoading.isLoading).toBe(true);
    });

    it('handles unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.fetchSettings();
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.error).toBe('Not authenticated');
      expect(state.isLoading).toBe(false);
    });

    it('handles RPC errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.fetchSettings();
      });

      const state = useLandlordSettingsStore.getState();
      // Store wraps errors with user-friendly messages
      expect(state.error).toBe('Failed to fetch settings');
    });

    it('calls get_or_create_platform_settings RPC', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: mockPlatformSettings,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.fetchSettings();
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_platform_settings', {
        p_user_id: 'user-1',
      });
    });

    it('merges fetched settings with defaults', async () => {
      // Simulate partial settings from DB
      const partialSettings = {
        ...mockPlatformSettings,
        landlord_settings: {
          ai_mode: 'training',
          // Missing other fields - should be filled from defaults
        },
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: partialSettings,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.fetchSettings();
      });

      const state = useLandlordSettingsStore.getState();
      // Custom value should be preserved
      expect(state.landlordSettings.ai_mode).toBe('training');
      // Default values should be filled in
      expect(state.landlordSettings.confidence_threshold).toBe(85);
    });
  });

  // ============================================
  // updateSettings Tests
  // ============================================

  describe('updateSettings', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('updates settings and persists to database', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockReturnValue({
        update: updateMock,
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.updateSettings({ confidence_threshold: 90 });
      });

      expect(result!).toBe(true);
      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.confidence_threshold).toBe(90);
      expect(state.isSaving).toBe(false);
    });

    it('handles update errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Update failed')),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.updateSettings({ confidence_threshold: 90 });
      });

      expect(result!).toBe(false);
      const state = useLandlordSettingsStore.getState();
      expect(state.error).toBe('Update failed');
    });

    it('fetches settings if platformSettings is null', async () => {
      useLandlordSettingsStore.setState({ platformSettings: null });

      const rpcMock = jest.fn().mockResolvedValue({
        data: mockPlatformSettings,
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockImplementation(rpcMock);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.updateSettings({ ai_mode: 'training' });
      });

      expect(rpcMock).toHaveBeenCalled();
    });
  });

  // ============================================
  // setAIMode Tests
  // ============================================

  describe('setAIMode', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('sets AI mode to training', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setAIMode('training');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.ai_mode).toBe('training');
    });

    it('sets AI mode to autonomous', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setAIMode('autonomous');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.ai_mode).toBe('autonomous');
    });
  });

  // ============================================
  // setConfidenceThreshold Tests
  // ============================================

  describe('setConfidenceThreshold', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('sets confidence threshold within valid range', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setConfidenceThreshold(75);
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.confidence_threshold).toBe(75);
    });

    it('clamps threshold to minimum 0', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setConfidenceThreshold(-10);
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.confidence_threshold).toBe(0);
    });

    it('clamps threshold to maximum 100', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setConfidenceThreshold(150);
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.confidence_threshold).toBe(100);
    });
  });

  // ============================================
  // toggleAlwaysReviewTopic Tests
  // ============================================

  describe('toggleAlwaysReviewTopic', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('adds topic when not present', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.toggleAlwaysReviewTopic('new_topic');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.always_review_topics).toContain('new_topic');
    });

    it('removes topic when present', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      // 'refund' is in the default list
      await act(async () => {
        await store.toggleAlwaysReviewTopic('refund');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.always_review_topics).not.toContain('refund');
    });
  });

  // ============================================
  // toggleNotification Tests
  // ============================================

  describe('toggleNotification', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('toggles boolean notification settings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      // Initial: new_leads = true
      await act(async () => {
        await store.toggleNotification('new_leads');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.notifications.new_leads).toBe(false);
    });

    it('returns false for non-boolean notification keys', async () => {
      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        // quiet_hours_start is a string, not boolean
        result = await store.toggleNotification('quiet_hours_start');
      });

      expect(result!).toBe(false);
    });
  });

  // ============================================
  // setResponseStyle Tests
  // ============================================

  describe('setResponseStyle', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('sets response style', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.setResponseStyle('professional');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.landlordSettings.response_style).toBe('professional');
    });
  });

  // ============================================
  // switchPlatform Tests
  // ============================================

  describe('switchPlatform', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
      });
    });

    it('switches to investor platform', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.switchPlatform('investor');
      });

      expect(result!).toBe(true);
      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings?.active_platform).toBe('investor');
    });

    it('switches to landlord platform', async () => {
      // Set initial state with investor active
      useLandlordSettingsStore.setState({
        platformSettings: { ...mockPlatformSettings, active_platform: 'investor' },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.switchPlatform('landlord');
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings?.active_platform).toBe('landlord');
    });

    it('calls switch_platform RPC', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const store = useLandlordSettingsStore.getState();

      await act(async () => {
        await store.switchPlatform('investor');
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('switch_platform', {
        p_user_id: 'user-1',
        p_platform: 'investor',
      });
    });

    it('handles switch errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Switch failed' },
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.switchPlatform('investor');
      });

      expect(result!).toBe(false);
      const state = useLandlordSettingsStore.getState();
      // Store wraps errors with user-friendly messages
      expect(state.error).toBe('Failed to switch platform');
    });
  });

  // ============================================
  // enableLandlordPlatform Tests
  // ============================================

  describe('enableLandlordPlatform', () => {
    it('enables landlord platform when not already enabled', async () => {
      useLandlordSettingsStore.setState({
        platformSettings: {
          ...mockPlatformSettings,
          enabled_platforms: ['investor'], // Only investor enabled
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.enableLandlordPlatform();
      });

      expect(result!).toBe(true);
      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings?.enabled_platforms).toContain('landlord');
    });

    it('returns true immediately if landlord already enabled', async () => {
      // Landlord already in enabled_platforms
      const store = useLandlordSettingsStore.getState();
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings, // Already has landlord enabled
      });

      let result: boolean;
      await act(async () => {
        result = await store.enableLandlordPlatform();
      });

      expect(result!).toBe(true);
      // Should not have called supabase
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // completeLandlordOnboarding Tests
  // ============================================

  describe('completeLandlordOnboarding', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: {
          ...mockPlatformSettings,
          completed_landlord_onboarding: false,
        },
      });
    });

    it('marks landlord onboarding as complete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const store = useLandlordSettingsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.completeLandlordOnboarding();
      });

      expect(result!).toBe(true);
      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings?.completed_landlord_onboarding).toBe(true);
    });
  });

  // ============================================
  // Utility Actions Tests
  // ============================================

  describe('Utility Actions', () => {
    it('clears error', () => {
      useLandlordSettingsStore.setState({ error: 'Some error' });

      const store = useLandlordSettingsStore.getState();

      act(() => {
        store.clearError();
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.error).toBeNull();
    });

    it('resets to initial state', () => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: { ...mockLandlordSettings, ai_mode: 'autonomous' },
        error: 'Some error',
        isLoading: true,
      });

      const store = useLandlordSettingsStore.getState();

      act(() => {
        store.reset();
      });

      const state = useLandlordSettingsStore.getState();
      expect(state.platformSettings).toBeNull();
      expect(state.landlordSettings.ai_mode).toBe('assisted'); // Back to default
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // Selectors Tests
  // ============================================

  describe('Selectors', () => {
    beforeEach(() => {
      useLandlordSettingsStore.setState({
        platformSettings: mockPlatformSettings,
        landlordSettings: mockLandlordSettings,
      });
    });

    it('selectAIMode returns AI mode', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectAIMode(state)).toBe('assisted');
    });

    it('selectConfidenceThreshold returns threshold', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectConfidenceThreshold(state)).toBe(85);
    });

    it('selectAlwaysReviewTopics returns topics array', () => {
      const state = useLandlordSettingsStore.getState();
      const topics = selectAlwaysReviewTopics(state);
      expect(topics).toContain('refund');
      expect(topics).toContain('damage');
    });

    it('selectResponseStyle returns style', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectResponseStyle(state)).toBe('friendly');
    });

    it('selectNotificationPreferences returns notification settings', () => {
      const state = useLandlordSettingsStore.getState();
      const prefs = selectNotificationPreferences(state);
      expect(prefs.new_leads).toBe(true);
      expect(prefs.quiet_hours_enabled).toBe(false);
    });

    it('selectAIPersonality returns personality settings', () => {
      const state = useLandlordSettingsStore.getState();
      const personality = selectAIPersonality(state);
      expect(personality.use_emojis).toBe(false);
      expect(personality.sign_off).toBe('Best');
    });

    it('selectLeadSettings returns lead settings', () => {
      const state = useLandlordSettingsStore.getState();
      const leadSettings = selectLeadSettings(state);
      expect(leadSettings.fast_response_enabled).toBe(true);
      expect(leadSettings.lead_confidence_threshold).toBe(70);
    });

    it('selectIsLandlordEnabled returns true when landlord platform is enabled', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectIsLandlordEnabled(state)).toBe(true);
    });

    it('selectIsLandlordEnabled returns false when landlord platform is not enabled', () => {
      useLandlordSettingsStore.setState({
        platformSettings: {
          ...mockPlatformSettings,
          enabled_platforms: ['investor'],
        },
      });
      const state = useLandlordSettingsStore.getState();
      expect(selectIsLandlordEnabled(state)).toBe(false);
    });

    it('selectIsLandlordEnabled returns false when platformSettings is null', () => {
      useLandlordSettingsStore.setState({ platformSettings: null });
      const state = useLandlordSettingsStore.getState();
      expect(selectIsLandlordEnabled(state)).toBe(false);
    });

    it('selectActivePlatform returns active platform', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectActivePlatform(state)).toBe('landlord');
    });

    it('selectActivePlatform returns investor when platformSettings is null', () => {
      useLandlordSettingsStore.setState({ platformSettings: null });
      const state = useLandlordSettingsStore.getState();
      expect(selectActivePlatform(state)).toBe('investor');
    });

    it('selectHasCompletedOnboarding returns completion status', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectHasCompletedOnboarding(state)).toBe(true);
    });

    it('selectEffectiveThreshold returns lead threshold for lead contacts with fast response', () => {
      const state = useLandlordSettingsStore.getState();
      // lead_confidence_threshold (70) is lower than confidence_threshold (85)
      // fast_response_enabled is true
      expect(selectEffectiveThreshold('lead')(state)).toBe(70);
    });

    it('selectEffectiveThreshold returns general threshold for non-lead contacts', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectEffectiveThreshold('guest')(state)).toBe(85);
    });

    it('selectEffectiveThreshold returns general threshold when fast response disabled', () => {
      useLandlordSettingsStore.setState({
        landlordSettings: {
          ...mockLandlordSettings,
          lead_settings: {
            ...mockLandlordSettings.lead_settings,
            fast_response_enabled: false,
          },
        },
      });
      const state = useLandlordSettingsStore.getState();
      expect(selectEffectiveThreshold('lead')(state)).toBe(85);
    });

    it('selectTopicRequiresReview returns true for sensitive topics', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectTopicRequiresReview('refund')(state)).toBe(true);
      expect(selectTopicRequiresReview('damage')(state)).toBe(true);
    });

    it('selectTopicRequiresReview returns false for non-sensitive topics', () => {
      const state = useLandlordSettingsStore.getState();
      expect(selectTopicRequiresReview('availability')(state)).toBe(false);
      expect(selectTopicRequiresReview('pricing')(state)).toBe(false);
    });
  });
});
