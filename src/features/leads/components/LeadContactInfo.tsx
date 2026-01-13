// src/features/leads/components/LeadContactInfo.tsx
// Contact information section for lead detail

import React from 'react';
import { View, Text } from 'react-native';
import { Mail, Phone, MapPin } from 'lucide-react-native';

interface LeadContactInfoProps {
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export function LeadContactInfo({
  email,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  zip,
}: LeadContactInfoProps) {
  const hasAddress = addressLine1 || city || state;

  return (
    <View className="bg-card p-4 mb-4">
      <Text className="text-lg font-semibold text-foreground mb-3">Contact Information</Text>

      {email && (
        <View className="flex-row items-center py-3 border-b border-border">
          <Mail size={18} color="#6b7280" />
          <Text className="flex-1 text-foreground ml-3">{email}</Text>
        </View>
      )}

      {phone && (
        <View className="flex-row items-center py-3 border-b border-border">
          <Phone size={18} color="#6b7280" />
          <Text className="flex-1 text-foreground ml-3">{phone}</Text>
        </View>
      )}

      {hasAddress && (
        <View className="flex-row items-start py-3">
          <MapPin size={18} color="#6b7280" />
          <View className="flex-1 ml-3">
            {addressLine1 && <Text className="text-foreground">{addressLine1}</Text>}
            {addressLine2 && <Text className="text-foreground">{addressLine2}</Text>}
            <Text className="text-muted-foreground">
              {[city, state, zip].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
