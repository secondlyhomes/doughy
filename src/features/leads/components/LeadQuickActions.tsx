// src/features/leads/components/LeadQuickActions.tsx
// Quick action buttons for calling, emailing, and texting leads

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Phone, Mail, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { sanitizePhone } from '@/utils/sanitize';

interface LeadQuickActionsProps {
  name: string;
  phone?: string | null;
  email?: string | null;
}

export function LeadQuickActions({ name, phone, email }: LeadQuickActionsProps) {
  const colors = useThemeColors();

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${sanitizePhone(phone)}`);
    }
  };

  const handleEmail = () => {
    if (email) {
      Linking.openURL(`mailto:${encodeURIComponent(email)}`);
    }
  };

  const handleSMS = () => {
    if (phone) {
      Linking.openURL(`sms:${sanitizePhone(phone)}`);
    }
  };

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
