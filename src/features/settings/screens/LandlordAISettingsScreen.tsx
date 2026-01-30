// src/features/settings/screens/LandlordAISettingsScreen.tsx
// Settings screen for Landlord AI communication preferences
// Part of Zone 2: AI Enhancement for the Doughy architecture refactor

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useLandlordSettingsStore } from '@/stores/landlord-settings-store';
import {
  AIModeSelector,
  ConfidenceThresholdSection,
  ReviewTopicsSection,
  ResponseStyleSelector,
  AIPersonalitySection,
  NotificationsSection,
  LearningSection,
} from './landlord-ai-settings';

export function LandlordAISettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const {
    landlordSettings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    setAIMode,
    setConfidenceThreshold,
    toggleAlwaysReviewTopic,
    toggleNotification,
    setResponseStyle,
    updateNestedSetting,
    clearError,
  } = useLandlordSettingsStore();

  const [localThreshold, setLocalThreshold] = useState(landlordSettings.confidence_threshold);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    setLocalThreshold(landlordSettings.confidence_threshold);
  }, [landlordSettings.confidence_threshold]);

  const handleThresholdChange = async (value: number) => {
    await setConfidenceThreshold(Math.round(value));
  };

  if (isLoading && !landlordSettings) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <LoadingSpinner />
      </ThemedView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            AI Communication Settings
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Configure how AI handles guest messages
          </Text>
        </View>
        {isSaving && <LoadingSpinner size="small" />}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
      >
        <AIModeSelector
          currentMode={landlordSettings.ai_mode}
          onModeChange={setAIMode}
        />

        <ConfidenceThresholdSection
          threshold={localThreshold}
          onThresholdChange={setLocalThreshold}
          onThresholdComplete={handleThresholdChange}
          fastResponseEnabled={landlordSettings.lead_settings.fast_response_enabled}
          leadThreshold={landlordSettings.lead_settings.lead_confidence_threshold}
          onFastResponseToggle={(value) =>
            updateNestedSetting('lead_settings', { fast_response_enabled: value })
          }
        />

        <ReviewTopicsSection
          enabledTopics={landlordSettings.always_review_topics}
          onToggleTopic={toggleAlwaysReviewTopic}
        />

        <ResponseStyleSelector
          currentStyle={landlordSettings.response_style}
          onStyleChange={setResponseStyle}
        />

        <AIPersonalitySection
          useEmojis={landlordSettings.ai_personality.use_emojis}
          greetingStyle={landlordSettings.ai_personality.greeting_style}
          signOff={landlordSettings.ai_personality.sign_off}
          onEmojiToggle={(value) =>
            updateNestedSetting('ai_personality', { use_emojis: value })
          }
          onGreetingChange={(value) =>
            updateNestedSetting('ai_personality', { greeting_style: value })
          }
          onSignOffChange={(value) =>
            updateNestedSetting('ai_personality', { sign_off: value })
          }
        />

        <NotificationsSection
          newLeads={landlordSettings.notifications.new_leads}
          aiNeedsReview={landlordSettings.notifications.ai_needs_review}
          bookingRequests={landlordSettings.notifications.booking_requests}
          quietHoursEnabled={landlordSettings.notifications.quiet_hours_enabled}
          quietHoursStart={landlordSettings.notifications.quiet_hours_start}
          quietHoursEnd={landlordSettings.notifications.quiet_hours_end}
          alwaysNotifyOnLeadResponse={landlordSettings.lead_settings.always_notify_on_lead_response}
          onToggleNewLeads={() => toggleNotification('new_leads')}
          onToggleAINeedsReview={() => toggleNotification('ai_needs_review')}
          onToggleBookingRequests={() => toggleNotification('booking_requests')}
          onToggleQuietHours={() => toggleNotification('quiet_hours_enabled')}
          onToggleLeadNotify={(value) =>
            updateNestedSetting('lead_settings', { always_notify_on_lead_response: value })
          }
        />

        <LearningSection
          enabled={landlordSettings.learning.enabled}
          onToggle={(value) => updateNestedSetting('learning', { enabled: value })}
        />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
