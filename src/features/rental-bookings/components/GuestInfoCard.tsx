// src/features/rental-bookings/components/GuestInfoCard.tsx
// Card showing guest/contact details with quick action buttons

import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { User, Phone, Mail, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';

export interface GuestInfoCardProps {
  /** Guest/contact ID for navigation to full profile */
  contactId?: string | null;
  /** Guest name */
  name?: string | null;
  /** Phone number */
  phone?: string | null;
  /** Email address */
  email?: string | null;
  /** Show link to full contact profile */
  showProfileLink?: boolean;
}

export function GuestInfoCard({
  contactId,
  name,
  phone,
  email,
  showProfileLink = true,
}: GuestInfoCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handleCall = async () => {
    if (!phone) return;

    haptic.light();
    const phoneUrl = `tel:${phone.replace(/\D/g, '')}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Unable to Call', 'Phone calls are not supported on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to initiate phone call.');
    }
  };

  const handleEmail = async () => {
    if (!email) return;

    haptic.light();
    const emailUrl = `mailto:${email}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Unable to Email', 'Email is not supported on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open email client.');
    }
  };

  const handleViewProfile = () => {
    if (!contactId) return;
    haptic.light();
    // Navigate to contact profile
    router.push(`/(tabs)/contacts/${contactId}`);
  };

  const hasContactInfo = name || phone || email;

  if (!hasContactInfo) {
    return (
      <View
        className="p-4 rounded-xl"
        style={{ backgroundColor: colors.card }}
      >
        <View className="flex-row items-center mb-3">
          <User size={ICON_SIZES.lg} color={colors.mutedForeground} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
            Guest Information
          </Text>
        </View>
        <View className="py-4 items-center">
          <User size={32} color={colors.border} />
          <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
            No guest assigned
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.card }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <User size={ICON_SIZES.lg} color={colors.mutedForeground} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
            Guest Information
          </Text>
        </View>
        {showProfileLink && contactId && (
          <TouchableOpacity
            onPress={handleViewProfile}
            className="flex-row items-center px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
            accessibilityLabel="View full contact profile"
            accessibilityRole="button"
          >
            <Text className="text-sm mr-1" style={{ color: colors.primary }}>
              Profile
            </Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Guest Name */}
      {name && (
        <View className="mb-4">
          <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>
            {name}
          </Text>
        </View>
      )}

      {/* Contact Actions */}
      <View className="flex-row gap-3">
        {/* Phone Button */}
        {phone && (
          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
            style={{
              backgroundColor: withOpacity(colors.success, 'medium'),
              borderRadius: BORDER_RADIUS.lg,
            }}
            accessibilityLabel={`Call ${name || 'guest'} at ${phone}`}
            accessibilityRole="button"
          >
            <Phone size={ICON_SIZES.md} color={colors.success} />
            <Text className="ml-2 font-medium" style={{ color: colors.success }}>
              Call
            </Text>
          </TouchableOpacity>
        )}

        {/* Email Button */}
        {email && (
          <TouchableOpacity
            onPress={handleEmail}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
            style={{
              backgroundColor: withOpacity(colors.info, 'medium'),
              borderRadius: BORDER_RADIUS.lg,
            }}
            accessibilityLabel={`Email ${name || 'guest'} at ${email}`}
            accessibilityRole="button"
          >
            <Mail size={ICON_SIZES.md} color={colors.info} />
            <Text className="ml-2 font-medium" style={{ color: colors.info }}>
              Email
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Details */}
      <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
        {phone && (
          <View className="flex-row items-center mb-2">
            <Phone size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
              {phone}
            </Text>
          </View>
        )}
        {email && (
          <View className="flex-row items-center">
            <Mail size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
              {email}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default GuestInfoCard;
