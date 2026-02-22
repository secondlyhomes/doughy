// src/features/leads/components/PropertyCardView.tsx
// Card view for a property with image and details, used in ExpandableLeadCard

import React, { useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PropertyImageCard } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '@/features/real-estate/utils/formatters';

import { LeadProperty } from '../types';
import { leadPropertyToProperty } from './expandable-lead-card-types';

/** Card view for a property with image and details */
export const PropertyCardView = React.memo(function PropertyCardView({
  property,
  onPress,
  onStartDeal,
}: {
  property: LeadProperty;
  onPress: () => void;
  onStartDeal?: () => void;
}) {
  const colors = useThemeColors();
  const convertedProperty = useMemo(() => leadPropertyToProperty(property), [property]);

  // Custom footer with Start Deal button if onStartDeal is provided
  const footerContent = onStartDeal ? (
    <TouchableOpacity
      onPress={onStartDeal}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        backgroundColor: withOpacity(colors.primary, 'light'),
        borderRadius: BORDER_RADIUS.sm,
      }}
      accessibilityLabel="Start deal with this property"
    >
      <Plus size={ICON_SIZES.sm} color={colors.primary} />
      <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '500', color: colors.primary }}>
        Start Deal
      </Text>
    </TouchableOpacity>
  ) : undefined;

  return (
    <PropertyImageCard
      imageUrl={getPropertyImageUrl(convertedProperty)}
      title={convertedProperty.address || 'Address not specified'}
      subtitle={getPropertyLocation(convertedProperty)}
      metrics={getInvestorPropertyMetrics(convertedProperty)}
      badgeOverlay={convertedProperty.propertyType ? {
        label: formatPropertyType(convertedProperty.propertyType),
        variant: 'secondary',
      } : undefined}
      onPress={onPress}
      footerContent={footerContent}
      showChevron={false}
    />
  );
});
