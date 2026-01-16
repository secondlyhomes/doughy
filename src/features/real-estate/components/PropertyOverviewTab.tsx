// src/features/real-estate/components/PropertyOverviewTab.tsx
// Overview tab content for property detail - basic info and details
// Uses useThemeColors() for reliable dark mode support

import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FileText, Home, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Property } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';
import { useThemeColors } from '@/context/ThemeContext';
import { usePropertyDeals } from '@/features/deals/hooks/usePropertyDeals';
import { RelatedDealsCard } from './RelatedDealsCard';

interface PropertyOverviewTabProps {
  property: Property;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: relatedDeals = [] } = usePropertyDeals(property.id);

  const handleDealPress = useCallback((dealId: string) => {
    router.push(`/(tabs)/deals/${dealId}`);
  }, [router]);

  const handleCreateDeal = useCallback(() => {
    // Navigate to create deal with pre-filled property
    router.push({
      pathname: '/(tabs)/deals/new',
      params: { propertyId: property.id },
    });
  }, [router, property.id]);

  return (
    <View className="gap-4">
      {/* Property Details Card */}
      <View
        className="rounded-xl p-4"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center mb-3">
          <Home size={18} color={colors.primary} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
            Property Details
          </Text>
        </View>

        <View className="gap-3">
          {property.lot_size && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Lot Size</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {formatNumber(property.lot_size)} sqft
              </Text>
            </View>
          )}
          {property.county && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>County</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.county}
              </Text>
            </View>
          )}
          {property.status && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Status</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.status}
              </Text>
            </View>
          )}
          {property.mls_id && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>MLS ID</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.mls_id}
              </Text>
            </View>
          )}
          {property.year_built && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Year Built</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.year_built}
              </Text>
            </View>
          )}
          {property.bedrooms && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Bedrooms</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.bedrooms}
              </Text>
            </View>
          )}
          {property.bathrooms && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Bathrooms</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {property.bathrooms}
              </Text>
            </View>
          )}
          {property.square_feet && (
            <View className="flex-row justify-between">
              <Text style={{ color: colors.mutedForeground }}>Square Feet</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {formatNumber(property.square_feet)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Location Card */}
      <View
        className="rounded-xl p-4"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center mb-3">
          <MapPin size={18} color={colors.primary} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
            Location
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground }}>Address</Text>
            <Text
              className="font-medium flex-1 text-right ml-4"
              style={{ color: colors.foreground }}
              numberOfLines={2}
            >
              {property.address || 'Not specified'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground }}>City</Text>
            <Text className="font-medium" style={{ color: colors.foreground }}>
              {property.city || 'Not specified'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground }}>State</Text>
            <Text className="font-medium" style={{ color: colors.foreground }}>
              {property.state || 'Not specified'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.mutedForeground }}>ZIP Code</Text>
            <Text className="font-medium" style={{ color: colors.foreground }}>
              {property.zip || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes Card */}
      {property.notes && (
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-3">
            <FileText size={18} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
              Notes
            </Text>
          </View>
          <Text className="leading-6" style={{ color: colors.foreground }}>
            {property.notes}
          </Text>
        </View>
      )}

      {/* Related Deals Card */}
      <RelatedDealsCard
        deals={relatedDeals}
        onDealPress={handleDealPress}
        onCreateDeal={handleCreateDeal}
      />

      {/* Timestamps */}
      <View className="px-2 pb-4">
        {property.created_at && (
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Added: {formatDate(property.created_at)}
          </Text>
        )}
        {property.updated_at && (
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            Last updated: {formatDate(property.updated_at)}
          </Text>
        )}
      </View>
    </View>
  );
}
