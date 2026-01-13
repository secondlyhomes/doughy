// src/features/real-estate/components/PropertyOverviewTab.tsx
// Overview tab content for property detail - basic info and details

import React from 'react';
import { View, Text } from 'react-native';
import { FileText, Home, MapPin, Ruler } from 'lucide-react-native';
import { Property } from '../types';
import { formatNumber, formatDate } from '../utils/formatters';

interface PropertyOverviewTabProps {
  property: Property;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  return (
    <View className="gap-4">
      {/* Property Details Card */}
      <View className="bg-card rounded-xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <Home size={18} className="text-primary" />
          <Text className="text-lg font-semibold text-foreground ml-2">Property Details</Text>
        </View>

        <View className="gap-3">
          {property.lot_size && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Lot Size</Text>
              <Text className="text-foreground font-medium">
                {formatNumber(property.lot_size)} sqft
              </Text>
            </View>
          )}
          {property.county && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">County</Text>
              <Text className="text-foreground font-medium">{property.county}</Text>
            </View>
          )}
          {property.status && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Status</Text>
              <Text className="text-foreground font-medium">{property.status}</Text>
            </View>
          )}
          {property.mls_id && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">MLS ID</Text>
              <Text className="text-foreground font-medium">{property.mls_id}</Text>
            </View>
          )}
          {property.year_built && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Year Built</Text>
              <Text className="text-foreground font-medium">{property.year_built}</Text>
            </View>
          )}
          {property.bedrooms && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Bedrooms</Text>
              <Text className="text-foreground font-medium">{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Bathrooms</Text>
              <Text className="text-foreground font-medium">{property.bathrooms}</Text>
            </View>
          )}
          {property.square_feet && (
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground">Square Feet</Text>
              <Text className="text-foreground font-medium">{formatNumber(property.square_feet)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Location Card */}
      <View className="bg-card rounded-xl p-4 border border-border">
        <View className="flex-row items-center mb-3">
          <MapPin size={18} className="text-primary" />
          <Text className="text-lg font-semibold text-foreground ml-2">Location</Text>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">Address</Text>
            <Text className="text-foreground font-medium flex-1 text-right ml-4" numberOfLines={2}>
              {property.address || 'Not specified'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">City</Text>
            <Text className="text-foreground font-medium">{property.city || 'Not specified'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">State</Text>
            <Text className="text-foreground font-medium">{property.state || 'Not specified'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">ZIP Code</Text>
            <Text className="text-foreground font-medium">{property.zip || 'Not specified'}</Text>
          </View>
        </View>
      </View>

      {/* Notes Card */}
      {property.notes && (
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-3">
            <FileText size={18} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Notes</Text>
          </View>
          <Text className="text-foreground leading-6">{property.notes}</Text>
        </View>
      )}

      {/* Timestamps */}
      <View className="px-2 pb-4">
        {property.created_at && (
          <Text className="text-xs text-muted-foreground">
            Added: {formatDate(property.created_at)}
          </Text>
        )}
        {property.updated_at && (
          <Text className="text-xs text-muted-foreground mt-1">
            Last updated: {formatDate(property.updated_at)}
          </Text>
        )}
      </View>
    </View>
  );
}
