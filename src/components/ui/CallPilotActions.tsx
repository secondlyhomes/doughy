// src/components/ui/CallPilotActions.tsx
// Shared action buttons for opening a contact/lead in CallPilot
// Provides Call and Message actions with deep linking + fallback

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

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
    const deepLink = `callpilot://${action}/${contactId}`;
    const canOpen = await Linking.canOpenURL(deepLink);

    if (canOpen) {
      Linking.openURL(deepLink);
    } else {
      Alert.alert(
        'CallPilot Not Installed',
        `Install CallPilot to ${action === 'call' ? 'call' : 'message'} ${contactName}.`,
        [{ text: 'OK' }]
      );
    }
  }, [contactId, contactName]);

  const buttonHeight = compact ? 32 : 40;
  const iconSize = compact ? ICON_SIZES.sm : ICON_SIZES.md;
  const fontSize = compact ? 12 : 14;

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
