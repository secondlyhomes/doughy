// src/features/guest-communication/components/RecipientInfo.tsx
// Displays the recipient name and contact detail for the selected channel

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import { MessageChannel } from '../types';

export interface RecipientInfoProps {
  guestName: string;
  channel: MessageChannel;
  phone?: string | null;
  email?: string | null;
}

export function RecipientInfo({
  guestName,
  channel,
  phone,
  email,
}: RecipientInfoProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Sending To">
      <View
        className="p-3 rounded-lg"
        style={{ backgroundColor: colors.muted }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontSize: FONT_SIZES.base,
            fontWeight: '500',
          }}
        >
          {guestName}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: FONT_SIZES.sm,
            marginTop: 4,
          }}
        >
          {channel === 'sms' ? phone : email}
        </Text>
      </View>
    </BottomSheetSection>
  );
}
