// src/features/leads/components/LeadQuickActions.tsx
// Quick action buttons for calling, emailing, and texting leads
// Uses VoIP for in-app calling (pro/premium users)

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, Mail, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { sanitizePhone } from '@/utils/sanitize';
import { useVoipCall } from '@/features/voip';
import type { SubscriptionTier } from '@/features/voip';

interface LeadQuickActionsProps {
  leadId?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  /** Subscription tier determines VoIP behavior: 'free' uses native dialer, 'pro'/'premium' use in-app calling.
   * Defaults to 'pro' to enable in-app calling for most users. */
  subscriptionTier?: SubscriptionTier;
}

export function LeadQuickActions({ leadId, name, phone, email, subscriptionTier = 'pro' }: LeadQuickActionsProps) {
  const colors = useThemeColors();

  // VoIP calling - uses in-app calling for pro/premium, native dialer for free
  const { startCall } = useVoipCall({ subscriptionTier });

  const handleCall = useCallback(() => {
    if (__DEV__) console.log('[VOIP DEBUG] handleCall triggered, phone:', phone);
    if (phone) {
      const sanitizedPhone = sanitizePhone(phone);
      if (__DEV__) console.log('[VOIP DEBUG] Calling startCall with:', sanitizedPhone, leadId, name);
      startCall(sanitizedPhone, leadId, name);
    }
  }, [phone, leadId, name, startCall]);

  const handleEmail = useCallback(async () => {
    if (!email) return;
    const url = `mailto:${encodeURIComponent(email)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Email', 'No email app is configured on this device.');
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to open email:', err);
      Alert.alert('Email Error', 'Unable to open email app. Please try again.');
    }
  }, [email]);

  const handleSMS = useCallback(async () => {
    if (!phone) return;
    const url = `sms:${sanitizePhone(phone)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Send SMS', 'SMS is not available on this device.');
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to open SMS:', err);
      Alert.alert('SMS Error', 'Unable to open messaging app. Please try again.');
    }
  }, [phone]);

  return (
    <View className="flex-row gap-3">
      {phone && (
        <TouchableOpacity
          className="flex-1 rounded-lg py-3 flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleCall}
          accessibilityLabel={`Call ${name}`}
          accessibilityRole="button"
        >
          <Phone size={18} color={colors.primaryForeground} />
          <Text className="font-medium ml-2" style={{ color: colors.primaryForeground }}>Call</Text>
        </TouchableOpacity>
      )}
      {email && (
        <TouchableOpacity
          className="flex-1 rounded-lg py-3 flex-row items-center justify-center"
          style={{ backgroundColor: colors.secondary }}
          onPress={handleEmail}
          accessibilityLabel={`Email ${name}`}
          accessibilityRole="button"
        >
          <Mail size={18} color={colors.mutedForeground} />
          <Text className="font-medium ml-2" style={{ color: colors.mutedForeground }}>Email</Text>
        </TouchableOpacity>
      )}
      {phone && (
        <TouchableOpacity
          className="flex-1 rounded-lg py-3 flex-row items-center justify-center"
          style={{ backgroundColor: colors.muted }}
          onPress={handleSMS}
          accessibilityLabel={`Send SMS to ${name}`}
          accessibilityRole="button"
        >
          <MessageSquare size={18} color={colors.mutedForeground} />
          <Text className="font-medium ml-2" style={{ color: colors.mutedForeground }}>SMS</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
