// src/features/dev/screens/SimulateInquiryScreen.tsx
// Mobile-friendly screen for testing the full OpenClaw email flow
// Creates test inquiries that go through the real approval flow

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Sparkles,
  Mail,
  User,
  Calendar,
  ChevronDown,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { Button, TAB_BAR_SAFE_PADDING, BottomSheet } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  PLATFORM_CONFIGS,
  PresetButton,
  useInquiryCreation,
  type Platform,
} from './simulate-inquiry';

export function SimulateInquiryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useAuth();

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('airbnb');
  const [showPlatformSheet, setShowPlatformSheet] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [messageContent, setMessageContent] = useState('');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  // Use the inquiry creation hook
  const { isCreating, lastCreatedConversationId, handleCreateInquiry, handleQuickTest } = useInquiryCreation({
    userId: user?.id,
    userEmail: user?.email,
  });

  // Get config for selected platform
  const platformConfig = PLATFORM_CONFIGS.find((p) => p.id === selectedPlatform)!;

  // Apply preset values
  const applyPreset = useCallback((platform: Platform) => {
    const config = PLATFORM_CONFIGS.find((p) => p.id === platform)!;
    setSelectedPlatform(platform);
    setContactName(config.sampleName);
    setMessageContent(config.sampleMessage);
    setContactEmail(user?.email || '');
    setShowPlatformSheet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [user?.email]);

  // Handle form submission
  const onCreateInquiry = useCallback(() => {
    handleCreateInquiry({
      platform: selectedPlatform,
      platformConfig,
      contactName,
      contactEmail,
      messageContent,
      checkInDate,
      checkOutDate,
    });
  }, [handleCreateInquiry, selectedPlatform, platformConfig, contactName, contactEmail, messageContent, checkInDate, checkOutDate]);

  // Handle quick test
  const onQuickTest = useCallback((platform: Platform) => {
    handleQuickTest(platform, checkInDate, checkOutDate);
  }, [handleQuickTest, checkInDate, checkOutDate]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: TAB_BAR_SAFE_PADDING }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: SPACING.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: FONT_SIZES['2xl'], fontWeight: 'bold' }}>
                Simulate Inquiry
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground, marginTop: SPACING.xs }}>
              Test the full OpenClaw email flow without needing Gmail API setup
            </Text>
          </View>

          {/* Quick Test Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              marginBottom: SPACING.lg,
              ...getShadowStyle(colors, { size: 'sm' }),
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.lg, marginBottom: SPACING.sm }}>
              Quick Test
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md }}>
              One tap to create a test inquiry with sample data
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {PLATFORM_CONFIGS.slice(0, 4).map((config) => (
                <TouchableOpacity
                  key={config.id}
                  onPress={() => onQuickTest(config.id)}
                  disabled={isCreating}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    gap: SPACING.xs,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{config.icon}</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '500' }}>{config.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Form Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              ...getShadowStyle(colors, { size: 'sm' }),
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.lg, marginBottom: SPACING.md }}>
              Custom Inquiry
            </Text>

            {/* Platform Selector */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Platform
              </Text>
              <TouchableOpacity
                onPress={() => setShowPlatformSheet(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: SPACING.sm }}>{platformConfig.icon}</Text>
                <Text style={{ flex: 1, color: colors.foreground }}>{platformConfig.name}</Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Contact Name */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Contact Name *
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <User size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="e.g., Sarah Johnson"
                  placeholderTextColor={colors.mutedForeground}
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Contact Email */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Contact Email *
              </Text>
              <Text style={{ color: colors.info, fontSize: FONT_SIZES['2xs'], marginBottom: 4 }}>
                Use YOUR email to receive the test response
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Mail size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder={user?.email || 'your-email@example.com'}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Check-in / Check-out Dates */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                  Check-in
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCheckInPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
                  <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
                    {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                  Check-out
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCheckOutPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
                  <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
                    {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Message Content */}
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Message *
              </Text>
              <View
                style={{
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 120,
                }}
              >
                <TextInput
                  value={messageContent}
                  onChangeText={setMessageContent}
                  placeholder="The inquiry message from the prospective tenant..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  textAlignVertical="top"
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Reply Method Info */}
            {platformConfig.replyMethod === 'platform_only' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: withOpacity(colors.warning, 'light'),
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ color: colors.warning, fontSize: FONT_SIZES.sm }}>
                  {platformConfig.name} requires in-platform messaging. The approved response will be shown for you to copy.
                </Text>
              </View>
            )}

            {/* Create Button */}
            <Button onPress={onCreateInquiry} disabled={isCreating} className="w-full">
              {isCreating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Loader2 size={18} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Creating...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Play size={18} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Create Test Inquiry</Text>
                </View>
              )}
            </Button>
          </View>

          {/* Success Toast */}
          {lastCreatedConversationId && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/landlord-inbox/${lastCreatedConversationId}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: withOpacity(colors.success, 'light'),
                marginTop: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <CheckCircle2 size={20} color={colors.success} />
              <Text style={{ flex: 1, color: colors.success, fontWeight: '500' }}>
                Last inquiry created! Tap to view.
              </Text>
              <ArrowRight size={18} color={colors.success} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Date Pickers */}
        {showCheckInPicker && (
          <DateTimePicker
            value={checkInDate}
            mode="date"
            display={RNPlatform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowCheckInPicker(RNPlatform.OS === 'ios');
              if (date) setCheckInDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {showCheckOutPicker && (
          <DateTimePicker
            value={checkOutDate}
            mode="date"
            display={RNPlatform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowCheckOutPicker(RNPlatform.OS === 'ios');
              if (date) setCheckOutDate(date);
            }}
            minimumDate={checkInDate}
          />
        )}

        {/* Platform Selection Sheet */}
        <BottomSheet
          visible={showPlatformSheet}
          onClose={() => setShowPlatformSheet(false)}
          title="Select Platform"
        >
          <View style={{ paddingBottom: SPACING.xl }}>
            {PLATFORM_CONFIGS.map((config) => (
              <PresetButton
                key={config.id}
                config={config}
                isSelected={selectedPlatform === config.id}
                onPress={() => applyPreset(config.id)}
              />
            ))}
          </View>
        </BottomSheet>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default SimulateInquiryScreen;
