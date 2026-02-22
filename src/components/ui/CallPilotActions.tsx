// src/components/ui/CallPilotActions.tsx
// Shared action buttons for opening a contact/lead in CallPilot
// Provides Call and Message actions with deep linking + fallback

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import { Phone, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES, ICON_CONTAINER_SIZES } from '@/constants/design-tokens';

const isExpoGo = Constants.appOwnership === 'expo';

export interface CallPilotActionsProps {
  /** Contact/lead ID to pass to CallPilot */
  contactId: string;
  /** Display name for the contact */
  contactName: string;
  /** Phone number (optional — disables call button if missing) */
  phone?: string | null;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Compact mode (smaller buttons) */
  compact?: boolean;
}

export function CallPilotActions({
  contactId,
  contactName,
  phone,
  direction = 'row',
  compact = false,
}: CallPilotActionsProps) {
  const colors = useThemeColors();

  const openInCallPilot = useCallback(async (action: 'call' | 'message') => {
    // Deep links don't work between Expo Go instances
    if (isExpoGo) {
      Alert.alert(
        'Open CallPilot',
        `Deep links require a standalone build. Open CallPilot and navigate to ${contactName} to ${action === 'call' ? 'start a call' : 'send a message'}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const deepLink = `callpilot://${action}/${contactId}`;
    try {
      const canOpen = await Linking.canOpenURL(deepLink);

      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        Alert.alert(
          'CallPilot Not Installed',
          `Install CallPilot to ${action === 'call' ? 'call' : 'message'} ${contactName}.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('[CallPilotActions] Failed to open deep link:', err);
      Alert.alert(
        'Unable to Open CallPilot',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [contactId, contactName]);

  const buttonHeight = compact ? ICON_CONTAINER_SIZES.sm : ICON_CONTAINER_SIZES.md;
  const iconSize = compact ? ICON_SIZES.sm : ICON_SIZES.md;
  const fontSize = compact ? FONT_SIZES.xs : FONT_SIZES.sm;

  return (
    <View style={{ flexDirection: direction, gap: SPACING.sm }}>
      <TouchableOpacity
        onPress={() => openInCallPilot('call')}
        disabled={!phone}
        style={{
          flex: direction === 'row' ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: buttonHeight,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: phone ? colors.primary : colors.muted,
          gap: SPACING.xs,
          paddingHorizontal: SPACING.md,
        }}
        accessibilityLabel={`Call ${contactName} via CallPilot`}
        accessibilityRole="button"
      >
        <Phone size={iconSize} color={phone ? colors.primaryForeground : colors.mutedForeground} />
        <Text style={{ color: phone ? colors.primaryForeground : colors.mutedForeground, fontSize, fontWeight: '600' }}>
          Call
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openInCallPilot('message')}
        style={{
          flex: direction === 'row' ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: buttonHeight,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: colors.secondary,
          gap: SPACING.xs,
          paddingHorizontal: SPACING.md,
        }}
        accessibilityLabel={`Message ${contactName} via CallPilot`}
        accessibilityRole="button"
      >
        <MessageSquare size={iconSize} color={colors.secondaryForeground} />
        <Text style={{ color: colors.secondaryForeground, fontSize, fontWeight: '600' }}>
          Message
        </Text>
      </TouchableOpacity>
    </View>
  );
}
