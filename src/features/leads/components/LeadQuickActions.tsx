// src/features/leads/components/LeadQuickActions.tsx
// Quick action buttons for calling, emailing, and texting leads

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Phone, Mail, MessageSquare } from 'lucide-react-native';
import { sanitizePhone } from '@/utils/sanitize';

interface LeadQuickActionsProps {
  name: string;
  phone?: string | null;
  email?: string | null;
}

export function LeadQuickActions({ name, phone, email }: LeadQuickActionsProps) {
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
          className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center"
          onPress={handleCall}
          accessibilityLabel={`Call ${name}`}
          accessibilityRole="button"
        >
          <Phone size={18} color="white" />
          <Text className="text-primary-foreground font-medium ml-2">Call</Text>
        </TouchableOpacity>
      )}
      {email && (
        <TouchableOpacity
          className="flex-1 bg-secondary rounded-lg py-3 flex-row items-center justify-center"
          onPress={handleEmail}
          accessibilityLabel={`Email ${name}`}
          accessibilityRole="button"
        >
          <Mail size={18} color="#1f2937" />
          <Text className="text-secondary-foreground font-medium ml-2">Email</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className="flex-1 bg-muted rounded-lg py-3 flex-row items-center justify-center"
        onPress={handleSMS}
        accessibilityLabel={`Send SMS to ${name}`}
        accessibilityRole="button"
      >
        <MessageSquare size={18} color="#6b7280" />
        <Text className="text-muted-foreground font-medium ml-2">SMS</Text>
      </TouchableOpacity>
    </View>
  );
}
