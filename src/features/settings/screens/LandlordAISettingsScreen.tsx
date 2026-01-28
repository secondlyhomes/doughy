// src/features/settings/screens/LandlordAISettingsScreen.tsx
// Settings screen for Landlord AI communication preferences
// Part of Zone 2: AI Enhancement for the Doughy architecture refactor

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import {
  Bot,
  MessageSquare,
  Bell,
  Shield,
  Sparkles,
  ChevronLeft,
  Check,
  Brain,
  Zap,
  Eye,
  Settings2,
  Clock,
  User,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  useLandlordSettingsStore,
  AIMode,
  ResponseStyle,
} from '@/stores/landlord-settings-store';

// AI Mode descriptions
const AI_MODE_INFO: Record<AIMode, { icon: React.ReactNode; title: string; description: string }> = {
  training: {
    icon: <Brain size={24} />,
    title: 'Training Mode',
    description: 'Queue most responses for your review. The AI learns from every action you take. Best for initial setup.',
  },
  assisted: {
    icon: <Eye size={24} />,
    title: 'Assisted Mode',
    description: 'Auto-send high-confidence responses, queue uncertain ones for review. Balanced control + automation.',
  },
  autonomous: {
    icon: <Zap size={24} />,
    title: 'Autonomous Mode',
    description: 'Handle almost everything automatically. Only escalates truly sensitive topics. Hands-off management.',
  },
};

// Response style descriptions
const RESPONSE_STYLE_INFO: Record<ResponseStyle, { title: string; example: string }> = {
  friendly: {
    title: 'Friendly',
    example: 'Hi Sarah! Great to hear from you...',
  },
  professional: {
    title: 'Professional',
    example: 'Dear Ms. Johnson, Thank you for your inquiry...',
  },
  brief: {
    title: 'Brief',
    example: 'Available Feb 1-30. $2,400/mo. Questions?',
  },
};

// Topics that can require review
const REVIEW_TOPICS = [
  { key: 'refund', label: 'Refunds', description: 'Any discussion of refunds or money back' },
  { key: 'discount', label: 'Discounts', description: 'Requests for reduced pricing' },
  { key: 'complaint', label: 'Complaints', description: 'Guest dissatisfaction or issues' },
  { key: 'cancellation', label: 'Cancellations', description: 'Booking cancellation requests' },
  { key: 'damage', label: 'Damage Reports', description: 'Property damage discussions' },
  { key: 'security_deposit', label: 'Security Deposits', description: 'Deposit-related questions' },
  { key: 'maintenance', label: 'Maintenance', description: 'Repair requests and issues' },
  { key: 'extension', label: 'Stay Extensions', description: 'Requests to extend booking' },
];

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

  // Local state for slider to avoid too many updates
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
        {/* AI Mode Selection */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            AI COMMUNICATION MODE
          </Text>

          <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
            {(['training', 'assisted', 'autonomous'] as AIMode[]).map((mode, index) => {
              const info = AI_MODE_INFO[mode];
              const isSelected = landlordSettings.ai_mode === mode;
              const isLast = index === 2;

              return (
                <TouchableOpacity
                  key={mode}
                  className="flex-row items-center p-4"
                  style={{
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border,
                    backgroundColor: isSelected ? `${colors.primary}15` : 'transparent',
                  }}
                  onPress={() => setAIMode(mode)}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.muted,
                    }}
                  >
                    {React.cloneElement(info.icon as React.ReactElement, {
                      color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                    })}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-medium"
                      style={{ color: isSelected ? colors.primary : colors.foreground }}
                    >
                      {info.title}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                      {info.description}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Confidence Threshold */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            AUTO-SEND CONFIDENCE THRESHOLD
          </Text>

          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ color: colors.foreground }}>
                Confidence Level: {localThreshold}%
              </Text>
              <View
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: withOpacity(
                    localThreshold >= 85
                      ? colors.success
                      : localThreshold >= 70
                      ? colors.warning
                      : colors.destructive,
                    'light'
                  ),
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{
                    color:
                      localThreshold >= 85
                        ? colors.success
                        : localThreshold >= 70
                        ? colors.warning
                        : colors.destructive,
                  }}
                >
                  {localThreshold >= 85 ? 'High' : localThreshold >= 70 ? 'Medium' : 'Low'}
                </Text>
              </View>
            </View>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={50}
              maximumValue={100}
              step={5}
              value={localThreshold}
              onValueChange={setLocalThreshold}
              onSlidingComplete={handleThresholdChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.muted}
              thumbTintColor={colors.primary}
            />

            <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
              Responses with confidence above {localThreshold}% will be sent automatically.
              Lower values mean more automation; higher values mean more review.
            </Text>

            {/* Lead-specific threshold */}
            <View
              className="flex-row items-center justify-between mt-4 pt-4"
              style={{ borderTopWidth: 1, borderTopColor: colors.border }}
            >
              <View className="flex-1">
                <Text style={{ color: colors.foreground }}>Fast Lead Response</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Use lower threshold ({landlordSettings.lead_settings.lead_confidence_threshold}%)
                  for new leads
                </Text>
              </View>
              <Switch
                value={landlordSettings.lead_settings.fast_response_enabled}
                onValueChange={(value) =>
                  updateNestedSetting('lead_settings', { fast_response_enabled: value })
                }
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* Topics That Always Require Review */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            TOPICS THAT ALWAYS NEED REVIEW
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            {REVIEW_TOPICS.map((topic, index) => {
              const isEnabled = landlordSettings.always_review_topics.includes(topic.key);
              const isLast = index === REVIEW_TOPICS.length - 1;

              return (
                <View
                  key={topic.key}
                  className="flex-row items-center p-4"
                  style={{
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.foreground }}>{topic.label}</Text>
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                      {topic.description}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => toggleAlwaysReviewTopic(topic.key)}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbTintColor={colors.card}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Response Style */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            RESPONSE STYLE
          </Text>

          <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
            {(['friendly', 'professional', 'brief'] as ResponseStyle[]).map((style, index) => {
              const info = RESPONSE_STYLE_INFO[style];
              const isSelected = landlordSettings.response_style === style;
              const isLast = index === 2;

              return (
                <TouchableOpacity
                  key={style}
                  className="flex-row items-center p-4"
                  style={{
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => setResponseStyle(style)}
                >
                  <View className="flex-1">
                    <Text
                      className="font-medium"
                      style={{ color: isSelected ? colors.primary : colors.foreground }}
                    >
                      {info.title}
                    </Text>
                    <Text
                      className="text-sm italic mt-1"
                      style={{ color: colors.mutedForeground }}
                    >
                      "{info.example}"
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Personality */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            AI PERSONALITY
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            {/* Use Emojis */}
            <View
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Sparkles size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>Use Emojis</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Add emojis to responses
                </Text>
              </View>
              <Switch
                value={landlordSettings.ai_personality.use_emojis}
                onValueChange={(value) =>
                  updateNestedSetting('ai_personality', { use_emojis: value })
                }
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>

            {/* Greeting Style */}
            <View
              className="p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Text style={{ color: colors.foreground }}>Greeting Style</Text>
              <TextInput
                className="mt-2 p-3 rounded-lg"
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={landlordSettings.ai_personality.greeting_style}
                onChangeText={(value) =>
                  updateNestedSetting('ai_personality', { greeting_style: value })
                }
                placeholder="Hi {first_name}!"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                Use {'{first_name}'} or {'{name}'} for personalization
              </Text>
            </View>

            {/* Sign Off */}
            <View className="p-4">
              <Text style={{ color: colors.foreground }}>Sign Off</Text>
              <TextInput
                className="mt-2 p-3 rounded-lg"
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={landlordSettings.ai_personality.sign_off}
                onChangeText={(value) =>
                  updateNestedSetting('ai_personality', { sign_off: value })
                }
                placeholder="Best"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            NOTIFICATIONS
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <View
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Bell size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>New Leads</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Get notified when new leads arrive
                </Text>
              </View>
              <Switch
                value={landlordSettings.notifications.new_leads}
                onValueChange={() => toggleNotification('new_leads')}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>

            <View
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Bot size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>AI Needs Review</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Get notified when AI queues a response for review
                </Text>
              </View>
              <Switch
                value={landlordSettings.notifications.ai_needs_review}
                onValueChange={() => toggleNotification('ai_needs_review')}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>

            <View
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <MessageSquare size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>Booking Requests</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Get notified for new booking inquiries
                </Text>
              </View>
              <Switch
                value={landlordSettings.notifications.booking_requests}
                onValueChange={() => toggleNotification('booking_requests')}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>

            {/* Quiet Hours */}
            <View
              className="flex-row items-center p-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Clock size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>Quiet Hours</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {landlordSettings.notifications.quiet_hours_start} -{' '}
                  {landlordSettings.notifications.quiet_hours_end}
                </Text>
              </View>
              <Switch
                value={landlordSettings.notifications.quiet_hours_enabled}
                onValueChange={() => toggleNotification('quiet_hours_enabled')}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>

            {/* Always notify for lead responses */}
            <View className="flex-row items-center p-4">
              <User size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>Notify on Lead Responses</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Even when AI auto-sends to leads
                </Text>
              </View>
              <Switch
                value={landlordSettings.lead_settings.always_notify_on_lead_response}
                onValueChange={(value) =>
                  updateNestedSetting('lead_settings', { always_notify_on_lead_response: value })
                }
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* Learning Settings */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            ADAPTIVE LEARNING
          </Text>

          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center p-4">
              <Brain size={20} color={colors.mutedForeground} />
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.foreground }}>Enable Learning</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  AI learns from your review patterns to improve over time
                </Text>
              </View>
              <Switch
                value={landlordSettings.learning.enabled}
                onValueChange={(value) =>
                  updateNestedSetting('learning', { enabled: value })
                }
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>
          </View>

          <Text className="text-sm mt-3 px-2" style={{ color: colors.mutedForeground }}>
            When enabled, the AI analyzes which responses you approve unchanged vs edit,
            and adjusts its confidence accordingly. After ~50 reviews, auto-send behavior
            becomes personalized to your preferences.
          </Text>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
