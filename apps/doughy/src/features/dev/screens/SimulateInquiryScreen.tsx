// src/features/dev/screens/SimulateInquiryScreen.tsx
// Mobile-friendly screen for testing the full OpenClaw email flow
// Creates test inquiries that go through the real approval flow

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  PLATFORM_CONFIGS,
  useInquiryCreation,
  QuickTestSection,
  CustomInquiryForm,
  SuccessToast,
  PlatformSelectionSheet,
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

          <QuickTestSection isCreating={isCreating} onQuickTest={onQuickTest} />

          <CustomInquiryForm
            platformConfig={platformConfig}
            contactName={contactName}
            contactEmail={contactEmail}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            messageContent={messageContent}
            userEmail={user?.email}
            isCreating={isCreating}
            onOpenPlatformSheet={() => setShowPlatformSheet(true)}
            onContactNameChange={setContactName}
            onContactEmailChange={setContactEmail}
            onOpenCheckInPicker={() => setShowCheckInPicker(true)}
            onOpenCheckOutPicker={() => setShowCheckOutPicker(true)}
            onMessageContentChange={setMessageContent}
            onCreateInquiry={onCreateInquiry}
          />

          {lastCreatedConversationId && (
            <SuccessToast
              conversationId={lastCreatedConversationId}
              onPress={() => router.push(`/(tabs)/landlord-inbox/${lastCreatedConversationId}`)}
            />
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

        <PlatformSelectionSheet
          visible={showPlatformSheet}
          selectedPlatform={selectedPlatform}
          onClose={() => setShowPlatformSheet(false)}
          onSelect={applyPreset}
        />
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default SimulateInquiryScreen;
