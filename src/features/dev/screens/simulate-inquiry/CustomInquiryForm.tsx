// src/features/dev/screens/simulate-inquiry/CustomInquiryForm.tsx
// Custom inquiry form with platform, contact, date, and message fields

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import {
  Mail,
  User,
  ChevronDown,
} from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

import { DateRangeSelector } from './DateRangeSelector';
import { MessageInputSection } from './MessageInputSection';
import type { PlatformConfig } from './types';

interface CustomInquiryFormProps {
  platformConfig: PlatformConfig;
  contactName: string;
  contactEmail: string;
  checkInDate: Date;
  checkOutDate: Date;
  messageContent: string;
  userEmail: string | undefined;
  isCreating: boolean;
  onOpenPlatformSheet: () => void;
  onContactNameChange: (text: string) => void;
  onContactEmailChange: (text: string) => void;
  onOpenCheckInPicker: () => void;
  onOpenCheckOutPicker: () => void;
  onMessageContentChange: (text: string) => void;
  onCreateInquiry: () => void;
}

export function CustomInquiryForm({
  platformConfig,
  contactName,
  contactEmail,
  checkInDate,
  checkOutDate,
  messageContent,
  userEmail,
  isCreating,
  onOpenPlatformSheet,
  onContactNameChange,
  onContactEmailChange,
  onOpenCheckInPicker,
  onOpenCheckOutPicker,
  onMessageContentChange,
  onCreateInquiry,
}: CustomInquiryFormProps) {
  const colors = useThemeColors();

  return (
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
          onPress={onOpenPlatformSheet}
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
            onChangeText={onContactNameChange}
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
            onChangeText={onContactEmailChange}
            placeholder={userEmail || 'your-email@example.com'}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ flex: 1, color: colors.foreground }}
          />
        </View>
      </View>

      <DateRangeSelector
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        onOpenCheckInPicker={onOpenCheckInPicker}
        onOpenCheckOutPicker={onOpenCheckOutPicker}
      />

      <MessageInputSection
        messageContent={messageContent}
        platformConfig={platformConfig}
        isCreating={isCreating}
        onMessageContentChange={onMessageContentChange}
        onCreateInquiry={onCreateInquiry}
      />
    </View>
  );
}
