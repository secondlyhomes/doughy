/**
 * PropertyCard Component (React Native)
 *
 * A card component for displaying property information in lists.
 * Optimized for mobile with touch interactions.
 *
 * Note: Uses useThemeColors() for reliable dark mode support.
 * See docs/TROUBLESHOOTING.md for why we use inline styles instead of Tailwind color classes.
 *
 * @deprecated Use `PropertyImageCard` from `@/components/ui` instead.
 * This component is maintained for backwards compatibility.
 * PropertyImageCard provides a unified property card UI across both
 * Investor and Landlord platforms with better maintainability.
 *
 * Migration example:
 * ```tsx
 * import { PropertyImageCard } from '@/components/ui';
 * import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
 *
 * <PropertyImageCard
 *   imageUrl={getPropertyImageUrl(property)}
 *   title={property.address}
 *   subtitle={getPropertyLocation(property)}
 *   metrics={getInvestorPropertyMetrics(property)}
 *   onPress={() => handlePress(property)}
 * />
 * ```
 */

import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { getPropertyTypeBadgeColor } from '../utils/formatters';
import { useThemeColors } from '@/contexts/ThemeContext';
import { GLASS_INTENSITY, PRESS_OPACITY } from '@/constants/design-tokens';
import { PropertyCardProps } from './PropertyCardTypes';
import { PropertyCardCompact } from './PropertyCardCompact';
import { PropertyCardFull } from './PropertyCardFull';

export { PropertyCardProps } from './PropertyCardTypes';

export const PropertyCard = React.memo<PropertyCardProps>(({
  property,
  isSelected = false,
  onPress,
  compact = false,
  variant = 'default',
  glassIntensity = GLASS_INTENSITY.strong,
}) => {
  const colors = useThemeColors();

  const handlePress = useCallback(() => {
    onPress(property);
  }, [onPress, property]);

  const badgeColor = useMemo(() => {
    return getPropertyTypeBadgeColor(property.propertyType);
  }, [property.propertyType]);

  // Get image URL with fallback to primary_image_url when first image URL is unavailable
  const imageUrl = property.images?.[0]?.url || property.primary_image_url;

  const contentProps = { property, variant, glassIntensity, colors, badgeColor, imageUrl };

  // Compact view for grid layouts
  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className="rounded-xl overflow-hidden shadow-sm"
        style={{
          backgroundColor: variant === 'glass' ? 'transparent' : colors.card,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityLabel={`Property at ${property.address || 'unknown address'}, ${property.city || ''}, ${property.state || ''}`}
        accessibilityRole="button"
        accessibilityHint="Tap to view property details"
      >
        <PropertyCardCompact {...contentProps} />
      </TouchableOpacity>
    );
  }

  // Full card view for list layouts
  return (
    <TouchableOpacity
      onPress={handlePress}
      className="rounded-xl overflow-hidden shadow-sm"
      style={{
        backgroundColor: variant === 'glass' ? 'transparent' : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
      }}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      accessibilityLabel={`Property at ${property.address || 'unknown address'}, ${property.city || ''}, ${property.state || ''}. ${property.bedrooms || 0} beds, ${property.bathrooms || 0} baths`}
      accessibilityRole="button"
      accessibilityHint="Tap to view property details"
    >
      <PropertyCardFull {...contentProps} />
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  // Must include onPress to handle callback updates, and images to handle async image loading
  const imagesEqual =
    prevProps.property.images?.length === nextProps.property.images?.length &&
    prevProps.property.images?.[0]?.url === nextProps.property.images?.[0]?.url &&
    prevProps.property.primary_image_url === nextProps.property.primary_image_url;

  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.compact === nextProps.compact &&
    prevProps.variant === nextProps.variant &&
    prevProps.glassIntensity === nextProps.glassIntensity &&
    prevProps.property.arv === nextProps.property.arv &&
    prevProps.property.address === nextProps.property.address &&
    prevProps.property.city === nextProps.property.city &&
    prevProps.property.state === nextProps.property.state &&
    prevProps.property.zip === nextProps.property.zip &&
    prevProps.property.status === nextProps.property.status &&
    prevProps.property.propertyType === nextProps.property.propertyType &&
    prevProps.property.bedrooms === nextProps.property.bedrooms &&
    prevProps.property.bathrooms === nextProps.property.bathrooms &&
    prevProps.property.square_feet === nextProps.property.square_feet &&
    prevProps.property.notes === nextProps.property.notes &&
    prevProps.onPress === nextProps.onPress &&
    imagesEqual
  );
});

PropertyCard.displayName = 'PropertyCard';
