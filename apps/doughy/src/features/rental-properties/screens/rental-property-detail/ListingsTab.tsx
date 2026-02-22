// src/features/rental-properties/screens/rental-property-detail/ListingsTab.tsx
// Listings tab content for rental property detail screen

import React from 'react';
import { Text, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui';
import { FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import type { RentalProperty } from '../../types';

export interface ListingsTabProps {
  property: RentalProperty;
}

export function ListingsTab({ property }: ListingsTabProps) {
  const colors = useThemeColors();

  return (
    <Card variant="glass" className="p-4">
      {property.listing_urls &&
        Object.entries(property.listing_urls).map(
          ([platform, url]) =>
            url && (
              <TouchableOpacity
                key={platform}
                onPress={() => Linking.openURL(url)}
                className="flex-row items-center justify-between py-3"
                activeOpacity={PRESS_OPACITY.DEFAULT}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    textTransform: 'capitalize',
                  }}
                >
                  {platform}
                </Text>
                <ExternalLink size={ICON_SIZES.md} color={colors.primary} />
              </TouchableOpacity>
            )
        )}
    </Card>
  );
}
