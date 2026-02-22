// src/features/guest-communication/components/ChannelPicker.tsx
// SMS / Email channel toggle for GuestMessageSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mail, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { MessageChannel } from '../types';

export interface ChannelPickerProps {
  channel: MessageChannel;
  onChangeChannel: (channel: MessageChannel) => void;
  canSendSMS: boolean;
  canSendEmail: boolean;
}

export function ChannelPicker({
  channel,
  onChangeChannel,
  canSendSMS,
  canSendEmail,
}: ChannelPickerProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Send Via">
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onChangeChannel('sms')}
          disabled={!canSendSMS}
          className="flex-1 flex-row items-center justify-center p-3 rounded-xl gap-2"
          style={{
            backgroundColor:
              channel === 'sms'
                ? withOpacity(colors.primary, 'light')
                : colors.muted,
            borderWidth: channel === 'sms' ? 1 : 0,
            borderColor: colors.primary,
            opacity: canSendSMS ? 1 : 0.5,
          }}
          activeOpacity={PRESS_OPACITY.DEFAULT}
        >
          <MessageSquare
            size={ICON_SIZES.ml}
            color={channel === 'sms' ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={{
              color: channel === 'sms' ? colors.primary : colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              fontWeight: channel === 'sms' ? '600' : '400',
            }}
          >
            SMS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChangeChannel('email')}
          disabled={!canSendEmail}
          className="flex-1 flex-row items-center justify-center p-3 rounded-xl gap-2"
          style={{
            backgroundColor:
              channel === 'email'
                ? withOpacity(colors.primary, 'light')
                : colors.muted,
            borderWidth: channel === 'email' ? 1 : 0,
            borderColor: colors.primary,
            opacity: canSendEmail ? 1 : 0.5,
          }}
          activeOpacity={PRESS_OPACITY.DEFAULT}
        >
          <Mail
            size={ICON_SIZES.ml}
            color={channel === 'email' ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={{
              color: channel === 'email' ? colors.primary : colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              fontWeight: channel === 'email' ? '600' : '400',
            }}
          >
            Email
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetSection>
  );
}
