// src/features/focus/components/PropertySelector.tsx
// Bottom sheet for selecting a property to focus on

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock, Search, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { BottomSheet, SearchBar, LoadingSpinner, Button } from '@/components/ui';
import { useProperties } from '@/features/real-estate/hooks/useProperties';
import { useRecentProperties } from '../hooks/useRecentProperties';
import { FocusedProperty } from '@/contexts/FocusModeContext';

interface PropertySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (property: FocusedProperty) => void;
}

export function PropertySelector({ visible, onClose, onSelect }: PropertySelectorProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all properties
  const { properties, isLoading } = useProperties({ limit: 100 });
  const { recentProperties } = useRecentProperties();

  // Filter properties by search
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const query = searchQuery.toLowerCase();
    return properties.filter(
      p =>
        p.address_line_1?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query)
    );
  }, [properties, searchQuery]);

  const handleSelect = (property: any) => {
    const focused: FocusedProperty = {
      id: property.id,
      address: property.address_line_1 || property.address,
      city: property.city,
      state: property.state,
      imageUrl: property.images?.[0]?.url,
      leadName: property.lead?.name,
      leadId: property.lead?.id || property.lead_id,
    };
    onSelect(focused);
    onClose();
  };

  const handleAddProperty = () => {
    onClose();
    router.push('/(tabs)/properties/add');
  };

  const renderPropertyItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: colors.muted,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.md,
      }}
    >
      {item.images?.[0]?.url ? (
        <Image
          source={{ uri: item.images[0].url }}
          style={{
            width: 48,
            height: 48,
            borderRadius: BORDER_RADIUS.md,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.primary, 'light'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={ICON_SIZES.md} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.foreground }}
          numberOfLines={1}
        >
          {item.address_line_1 || item.address}
        </Text>
        <Text
          style={{ fontSize: FONT_SIZES.sm, color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {item.city}, {item.state}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: FocusedProperty }) => (
    <TouchableOpacity
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        backgroundColor: withOpacity(colors.primary, 'subtle'),
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
        marginRight: SPACING.sm,
      }}
    >
      <Clock size={14} color={colors.primary} />
      <Text style={{ fontSize: FONT_SIZES.sm, color: colors.primary }} numberOfLines={1}>
        {item.address}
      </Text>
    </TouchableOpacity>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Property"
      snapPoints={['70%', '90%']}
      scrollable={false}
    >
      <View style={{ flex: 1 }}>
        {/* Search */}
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search properties..."
            size="md"
            glass
          />
        </View>

        {/* Recent properties */}
        {recentProperties.length > 0 && !searchQuery && (
          <View style={{ marginBottom: SPACING.md }}>
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                fontWeight: '600',
                color: colors.mutedForeground,
                paddingHorizontal: SPACING.md,
                marginBottom: SPACING.sm,
              }}
            >
              RECENT
            </Text>
            <FlatList
              horizontal
              data={recentProperties}
              renderItem={renderRecentItem}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.md }}
            />
          </View>
        )}

        {/* All properties */}
        <View style={{ flex: 1, paddingHorizontal: SPACING.md }}>
          {!searchQuery && (
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: SPACING.sm,
              }}
            >
              ALL PROPERTIES
            </Text>
          )}

          {isLoading ? (
            <View style={{ padding: SPACING.xl }}>
              <LoadingSpinner />
            </View>
          ) : filteredProperties.length === 0 ? (
            <View style={{ alignItems: 'center', padding: SPACING.xl }}>
              <MapPin size={48} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: FONT_SIZES.base,
                  fontWeight: '500',
                  color: colors.foreground,
                  marginTop: SPACING.md,
                }}
              >
                {searchQuery ? 'No matches found' : 'No properties yet'}
              </Text>
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: colors.mutedForeground,
                  marginTop: SPACING.xs,
                  textAlign: 'center',
                }}
              >
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add a property to get started'}
              </Text>
              {!searchQuery && (
                <Button
                  onPress={handleAddProperty}
                  variant="default"
                  size="default"
                  style={{ marginTop: SPACING.md }}
                >
                  <Plus size={ICON_SIZES.md} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, marginLeft: SPACING.xs }}>
                    Add Property
                  </Text>
                </Button>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredProperties}
              renderItem={renderPropertyItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.xl }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

export default PropertySelector;
