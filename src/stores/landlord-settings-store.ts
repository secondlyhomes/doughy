// src/stores/landlord-settings-store.ts
// Zustand store for Landlord platform settings and AI preferences
// Part of Zone 2: AI Enhancement for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// AI Mode types
export type AIMode = 'training' | 'assisted' | 'autonomous';
export type ResponseStyle = 'friendly' | 'professional' | 'brief';

// Notification preferences
export interface NotificationPreferences {
  new_leads: boolean;
  ai_needs_review: boolean;
  booking_requests: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string;   // HH:MM format
}

// AI personality customization
export interface AIPersonality {
  use_emojis: boolean;
  greeting_style: string;
  sign_off: string;
  owner_name: string | null;
}

// Lead handling settings
export interface LeadSettings {
  fast_response_enabled: boolean;
  lead_confidence_threshold: number;
  always_notify_on_lead_response: boolean;
  auto_score_leads: boolean;
}

// Learning settings
export interface LearningSettings {
  enabled: boolean;
  min_samples_for_auto_adjust: number;
  recalculate_frequency_days: number;
}

// Template settings
export interface TemplateSettings {
  use_custom_templates: boolean;
  ai_can_suggest_templates: boolean;
}

// Full landlord settings structure (matches JSONB in DB)
export interface LandlordSettings {
  ai_mode: AIMode;
  ai_auto_respond: boolean;
  confidence_threshold: number; // 0-100
  always_review_topics: string[];
  notify_for_contact_types: string[];
  response_style: ResponseStyle;
  notifications: NotificationPreferences;
  ai_personality: AIPersonality;
  learning: LearningSettings;
  lead_settings: LeadSettings;
  templates: TemplateSettings;
}

// User platform settings from DB
export interface UserPlatformSettings {
  id: string;
  user_id: string;
  enabled_platforms: string[];
  active_platform: 'investor' | 'landlord';
  completed_investor_onboarding: boolean;
  completed_landlord_onboarding: boolean;
  landlord_settings: LandlordSettings;
  created_at: string;
  updated_at: string;
}

// Default settings (matches get_default_landlord_settings() in DB)
const DEFAULT_LANDLORD_SETTINGS: LandlordSettings = {
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

export interface LandlordSettingsState {
  // Data
  platformSettings: UserPlatformSettings | null;
  landlordSettings: LandlordSettings;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<LandlordSettings>) => Promise<boolean>;
  updateNestedSetting: <K extends keyof LandlordSettings>(
    key: K,
    value: Partial<LandlordSettings[K]>
  ) => Promise<boolean>;
  setAIMode: (mode: AIMode) => Promise<boolean>;
  setConfidenceThreshold: (threshold: number) => Promise<boolean>;
  toggleAlwaysReviewTopic: (topic: string) => Promise<boolean>;
  toggleNotification: (key: keyof NotificationPreferences) => Promise<boolean>;
  setResponseStyle: (style: ResponseStyle) => Promise<boolean>;
  switchPlatform: (platform: 'investor' | 'landlord') => Promise<boolean>;
  enableLandlordPlatform: () => Promise<boolean>;
  completeLandlordOnboarding: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  platformSettings: null,
  landlordSettings: DEFAULT_LANDLORD_SETTINGS,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useLandlordSettingsStore = create<LandlordSettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          // Use RPC to get or create settings (matches DB function)
          const { data, error } = await supabase
            .rpc('get_or_create_platform_settings', { p_user_id: user.id });

          if (error) throw error;

          const platformSettings = data as UserPlatformSettings;

          // Merge with defaults to ensure all keys exist
          const mergedSettings = {
            ...DEFAULT_LANDLORD_SETTINGS,
            ...platformSettings.landlord_settings,
          };

          set({
            platformSettings,
            landlordSettings: mergedSettings,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch settings';
          set({ error: message, isLoading: false });
        }
      },

      updateSettings: async (updates: Partial<LandlordSettings>) => {
        set({ isSaving: true, error: null });
        try {
          const { landlordSettings, platformSettings } = get();
          if (!platformSettings) {
            await get().fetchSettings();
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const newSettings = { ...landlordSettings, ...updates };

          const { error } = await supabase
            .from('user_platform_settings')
            .update({
              landlord_settings: newSettings,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (error) throw error;

          set({
            landlordSettings: newSettings,
            isSaving: false,
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update settings';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      updateNestedSetting: async <K extends keyof LandlordSettings>(
        key: K,
        value: Partial<LandlordSettings[K]>
      ) => {
        const { landlordSettings } = get();
        const currentValue = landlordSettings[key];

        // For object values, merge; for primitives, replace
        const newValue = typeof currentValue === 'object' && currentValue !== null
          ? { ...currentValue, ...value }
          : value;

        return get().updateSettings({ [key]: newValue } as Partial<LandlordSettings>);
      },

      setAIMode: async (mode: AIMode) => {
        return get().updateSettings({ ai_mode: mode });
      },

      setConfidenceThreshold: async (threshold: number) => {
        // Clamp between 0-100
        const clamped = Math.max(0, Math.min(100, threshold));
        return get().updateSettings({ confidence_threshold: clamped });
      },

      toggleAlwaysReviewTopic: async (topic: string) => {
        const { landlordSettings } = get();
        const topics = landlordSettings.always_review_topics;

        const newTopics = topics.includes(topic)
          ? topics.filter(t => t !== topic)
          : [...topics, topic];

        return get().updateSettings({ always_review_topics: newTopics });
      },

      toggleNotification: async (key: keyof NotificationPreferences) => {
        const { landlordSettings } = get();
        const currentValue = landlordSettings.notifications[key];

        // Only toggle boolean values
        if (typeof currentValue !== 'boolean') return false;

        return get().updateNestedSetting('notifications', { [key]: !currentValue });
      },

      setResponseStyle: async (style: ResponseStyle) => {
        return get().updateSettings({ response_style: style });
      },

      switchPlatform: async (platform: 'investor' | 'landlord') => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .rpc('switch_platform', { p_user_id: user.id, p_platform: platform });

          if (error) throw error;

          set((state) => ({
            platformSettings: state.platformSettings
              ? { ...state.platformSettings, active_platform: platform }
              : null,
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to switch platform';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      enableLandlordPlatform: async () => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { platformSettings } = get();
          const currentPlatforms = platformSettings?.enabled_platforms || ['investor'];

          if (currentPlatforms.includes('landlord')) {
            set({ isSaving: false });
            return true;
          }

          const newPlatforms = [...currentPlatforms, 'landlord'];

          const { error } = await supabase
            .from('user_platform_settings')
            .update({
              enabled_platforms: newPlatforms,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            platformSettings: state.platformSettings
              ? { ...state.platformSettings, enabled_platforms: newPlatforms }
              : null,
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to enable landlord platform';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      completeLandlordOnboarding: async () => {
        set({ isSaving: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const { error } = await supabase
            .from('user_platform_settings')
            .update({
              completed_landlord_onboarding: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (error) throw error;

          set((state) => ({
            platformSettings: state.platformSettings
              ? { ...state.platformSettings, completed_landlord_onboarding: true }
              : null,
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'landlord-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        landlordSettings: state.landlordSettings,
      }),
    }
  )
);

// Selectors
export const selectAIMode = (state: LandlordSettingsState) => state.landlordSettings.ai_mode;
export const selectConfidenceThreshold = (state: LandlordSettingsState) =>
  state.landlordSettings.confidence_threshold;
export const selectAlwaysReviewTopics = (state: LandlordSettingsState) =>
  state.landlordSettings.always_review_topics;
export const selectResponseStyle = (state: LandlordSettingsState) =>
  state.landlordSettings.response_style;
export const selectNotificationPreferences = (state: LandlordSettingsState) =>
  state.landlordSettings.notifications;
export const selectAIPersonality = (state: LandlordSettingsState) =>
  state.landlordSettings.ai_personality;
export const selectLeadSettings = (state: LandlordSettingsState) =>
  state.landlordSettings.lead_settings;
export const selectIsLandlordEnabled = (state: LandlordSettingsState) =>
  state.platformSettings?.enabled_platforms.includes('landlord') ?? false;
export const selectActivePlatform = (state: LandlordSettingsState) =>
  state.platformSettings?.active_platform ?? 'investor';
export const selectHasCompletedOnboarding = (state: LandlordSettingsState) =>
  state.platformSettings?.completed_landlord_onboarding ?? false;

// Computed selector for effective confidence threshold based on contact type
export const selectEffectiveThreshold = (contactType: string) => (state: LandlordSettingsState) => {
  const { landlordSettings } = state;

  if (contactType === 'lead' && landlordSettings.lead_settings.fast_response_enabled) {
    return Math.min(
      landlordSettings.confidence_threshold,
      landlordSettings.lead_settings.lead_confidence_threshold
    );
  }

  return landlordSettings.confidence_threshold;
};

// Check if a topic requires review
export const selectTopicRequiresReview = (topic: string) => (state: LandlordSettingsState) =>
  state.landlordSettings.always_review_topics.includes(topic);
