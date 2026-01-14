// src/features/leads/components/LeadContactInfo.tsx
// Contact information section for lead detail

import React from 'react';
import { View, Text } from 'react-native';
import { Mail, Phone, MapPin } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

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
  const colors = useThemeColors();
  const hasAddress = addressLine1 || city || state;

  return (
    <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Contact Information</Text>

      {email && (
        <View className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Mail size={18} color={colors.mutedForeground} />
          <Text className="flex-1 ml-3" style={{ color: colors.foreground }}>{email}</Text>
        </View>
      )}

      {phone && (
        <View className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Phone size={18} color={colors.mutedForeground} />
          <Text className="flex-1 ml-3" style={{ color: colors.foreground }}>{phone}</Text>
        </View>
      )}

      {hasAddress && (
        <View className="flex-row items-start py-3">
          <MapPin size={18} color={colors.mutedForeground} />
          <View className="flex-1 ml-3">
            {addressLine1 && <Text style={{ color: colors.foreground }}>{addressLine1}</Text>}
            {addressLine2 && <Text style={{ color: colors.foreground }}>{addressLine2}</Text>}
            <Text style={{ color: colors.mutedForeground }}>
              {[city, state, zip].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
