// src/features/leads/components/ExpandableLeadCard.tsx
// Expandable lead card with nested properties for hierarchical view

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Home,
  Building2,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge, PropertyImageCard } from '@/components/ui';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { formatStatus, getStatusBadgeVariant, formatCurrency } from '@/lib/formatters';
import { SPACING, BORDER_RADIUS, FONT_SIZES, PRESS_OPACITY, ICON_SIZES } from '@/constants/design-tokens';
import { getInvestorPropertyMetrics, getPropertyImageUrl, getPropertyLocation } from '@/lib/property-card-utils';
import { formatPropertyType } from '@/features/real-estate/utils/formatters';
import type { Property } from '@/features/real-estate/types/property';

import { LeadWithProperties, LeadProperty, LeadStatus } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableLeadCardProps {
  lead: LeadWithProperties;
  onLeadPress?: () => void;
  onPropertyPress?: (property: LeadProperty) => void;
  onStartDeal?: (leadId: string | undefined, propertyId?: string) => void;
  initiallyExpanded?: boolean;
  /** View mode for properties: 'card' shows PropertyCard, 'list' shows compact rows */
  propertyViewMode?: 'list' | 'card';
}

/** Convert LeadProperty to Property for use with PropertyCard */
function leadPropertyToProperty(leadProp: LeadProperty): Property {
  return {
    id: leadProp.id,
    address: leadProp.address_line_1,
    address_line_1: leadProp.address_line_1,
    address_line_2: leadProp.address_line_2,
    city: leadProp.city,
    state: leadProp.state,
    zip: leadProp.zip,
    bedrooms: leadProp.bedrooms ?? 0,
    bathrooms: leadProp.bathrooms ?? 0,
    square_feet: leadProp.square_feet ?? 0,
    arv: leadProp.arv,
    purchase_price: leadProp.purchase_price,
    status: leadProp.status,
    propertyType: leadProp.property_type || 'other',
    property_type: leadProp.property_type,
    images: leadProp.images?.map(img => ({
      id: img.id,
      property_id: leadProp.id,
      url: img.url,
      is_primary: img.is_primary,
      label: img.label,
    })),
  };
}

/** List view row for a property - compact single line */
const PropertyListRow = React.memo(function PropertyListRow({
  property,
  onPress,
  onStartDeal,
}: {
  property: LeadProperty;
  onPress: () => void;
  onStartDeal?: () => void;
}) {
  const colors = useThemeColors();

  const detailParts: string[] = [];
  if (property.bedrooms) detailParts.push(`${property.bedrooms}bd`);
  if (property.bathrooms) detailParts.push(`${property.bathrooms}ba`);
  if (property.arv) detailParts.push(formatCurrency(property.arv));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: colors.muted,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.xs,
      }}
    >
      <Home size={ICON_SIZES.md} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
          {property.address_line_1}, {property.city} {property.state}
        </Text>
        {detailParts.length > 0 && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground, marginTop: SPACING.xxs }}>
            {detailParts.join(' · ')}
          </Text>
        )}
      </View>
      {onStartDeal && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onStartDeal();
          }}
          style={{
            padding: SPACING.xs,
            backgroundColor: withOpacity(colors.primary, 'light'),
            borderRadius: BORDER_RADIUS.sm,
            marginRight: SPACING.xs,
          }}
          accessibilityLabel="Start deal"
        >
          <Plus size={ICON_SIZES.md} color={colors.primary} />
        </TouchableOpacity>
      )}
      <ChevronRight size={ICON_SIZES.md} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
});

/** Card view for a property with image and details */
const PropertyCardView = React.memo(function PropertyCardView({
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

function ExpandableLeadCardInner({
  lead,
  onLeadPress,
  onPropertyPress,
  onStartDeal,
  initiallyExpanded = false,
  propertyViewMode = 'card',
}: ExpandableLeadCardProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handlePropertyPress = useCallback((property: LeadProperty) => {
    if (onPropertyPress) {
      onPropertyPress(property);
    } else {
      // Navigate within the leads stack (NativeTabs doesn't support cross-tab to hidden tabs)
      router.push(`/(tabs)/leads/property/${property.id}`);
    }
  }, [onPropertyPress, router]);

  const handleStartDealForProperty = useCallback((propertyId: string) => {
    if (onStartDeal) {
      onStartDeal(lead.id, propertyId);
    }
  }, [onStartDeal, lead.id]);

  const hasProperties = lead.propertyCount > 0;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
    >
      {/* Main Lead Header */}
      <TouchableOpacity
        onPress={onLeadPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        style={{ padding: SPACING.md }}
        accessibilityRole="button"
        accessibilityLabel={`View ${lead.name || 'lead'} details`}
      >
        {/* Row 1: Name, Star, Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: colors.foreground, flex: 1 }} numberOfLines={1}>
            {lead.name || 'Unnamed Lead'}
          </Text>
          {lead.starred && <Star size={ICON_SIZES.sm} color={colors.warning} fill={colors.warning} />}
          <Badge variant={getStatusBadgeVariant(lead.status)} size="sm">
            {formatStatus(lead.status)}
          </Badge>
        </View>

        {/* Row 2: Email, Phone, Button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs }}>
          {lead.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Mail size={ICON_SIZES.xs} color={colors.mutedForeground} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }} numberOfLines={1}>
                {lead.email}
              </Text>
            </View>
          )}
          {lead.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <Phone size={ICON_SIZES.xs} color={colors.mutedForeground} />
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }}>
                {lead.phone}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {hasProperties && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              activeOpacity={PRESS_OPACITY.DEFAULT}
              accessibilityRole="button"
              accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${lead.propertyCount} ${lead.propertyCount === 1 ? 'property' : 'properties'}`}
              accessibilityState={{ expanded }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  backgroundColor: withOpacity(colors.primary, 'light'),
                  paddingVertical: SPACING.xs,
                  paddingHorizontal: SPACING.sm,
                  borderRadius: BORDER_RADIUS.full,
                }}
              >
                <Building2 size={ICON_SIZES.sm} color={colors.primary} />
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: colors.primary }}>
                  {lead.propertyCount}
                </Text>
                {expanded ? (
                  <ChevronDown size={ICON_SIZES.md} color={colors.primary} />
                ) : (
                  <ChevronRight size={ICON_SIZES.md} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Properties Section */}
      {expanded && hasProperties && (
        <View
          style={{
            paddingHorizontal: SPACING.sm,
            paddingBottom: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 0,
          }}
        >
          {/* Card View: Full-width vertical stack of PropertyCards */}
          {propertyViewMode === 'card' ? (
            <View style={{ paddingVertical: SPACING.sm, gap: SPACING.sm }}>
              {lead.properties.map((property) => (
                <PropertyCardView
                  key={property.id}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                  onStartDeal={onStartDeal ? () => handleStartDealForProperty(property.id) : undefined}
                />
              ))}
            </View>
          ) : (
            /* List View: Stacked rows */
            <View style={{ paddingTop: SPACING.xs }}>
              {lead.properties.map((property) => (
                <PropertyListRow
                  key={property.id}
                  property={property}
                  onPress={() => handlePropertyPress(property)}
                  onStartDeal={onStartDeal ? () => handleStartDealForProperty(property.id) : undefined}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Quick Actions Row - Shown when collapsed */}
      {!expanded && onStartDeal && (
        <View
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => onStartDeal(lead.id)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: SPACING.sm,
              gap: SPACING.xs,
            }}
            accessibilityRole="button"
            accessibilityLabel="Start deal"
          >
            <Plus size={ICON_SIZES.md} color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.primary }}>
              Start Deal
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Custom comparison for React.memo - only re-render when lead data actually changes */
function arePropsEqual(prevProps: ExpandableLeadCardProps, nextProps: ExpandableLeadCardProps): boolean {
  // Compare lead by id and key fields that affect rendering
  if (prevProps.lead.id !== nextProps.lead.id) return false;
  if (prevProps.lead.name !== nextProps.lead.name) return false;
  if (prevProps.lead.email !== nextProps.lead.email) return false;
  if (prevProps.lead.phone !== nextProps.lead.phone) return false;
  if (prevProps.lead.status !== nextProps.lead.status) return false;
  if (prevProps.lead.starred !== nextProps.lead.starred) return false;
  if (prevProps.lead.propertyCount !== nextProps.lead.propertyCount) return false;
  if (prevProps.lead.properties?.length !== nextProps.lead.properties?.length) return false;

  // Compare other props
  if (prevProps.initiallyExpanded !== nextProps.initiallyExpanded) return false;
  if (prevProps.propertyViewMode !== nextProps.propertyViewMode) return false;

  // Callbacks are stable if they're memoized in parent
  return true;
}

export const ExpandableLeadCard = React.memo(ExpandableLeadCardInner, arePropsEqual);

export default ExpandableLeadCard;
