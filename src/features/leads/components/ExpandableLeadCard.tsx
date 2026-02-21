// src/features/leads/components/ExpandableLeadCard.tsx
// Expandable lead card with nested properties for hierarchical view

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';

import { LeadProperty } from '../types';
import { ExpandableLeadCardProps } from './expandable-lead-card-types';
import { LeadCardHeader } from './LeadCardHeader';
import { PropertyListRow } from './PropertyListRow';
import { PropertyCardView } from './PropertyCardView';

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
      <LeadCardHeader
        lead={lead}
        expanded={expanded}
        hasProperties={hasProperties}
        onLeadPress={onLeadPress}
        onToggleExpanded={toggleExpanded}
      />

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
