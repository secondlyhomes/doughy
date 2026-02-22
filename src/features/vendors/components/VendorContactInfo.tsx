// src/features/vendors/components/VendorContactInfo.tsx
// Vendor contact info display for MessageVendorSheet

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import { MessageChannel } from './message-vendor-types';
import { Vendor } from '../types';

export interface VendorContactInfoProps {
  vendor: Vendor;
  channel: MessageChannel;
}

export function VendorContactInfo({ vendor, channel }: VendorContactInfoProps) {
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
          {vendor.name}
          {vendor.company_name && ` (${vendor.company_name})`}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: FONT_SIZES.sm,
            marginTop: 4,
          }}
        >
          {channel === 'email'
            ? vendor.email
            : vendor.phone}
        </Text>
      </View>
    </BottomSheetSection>
  );
}
