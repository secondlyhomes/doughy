/**
 * LinkDocumentSheet Component
 * Bottom sheet modal for linking a document to multiple properties (package deals)
 *
 * Features:
 * - Search/filter properties by address
 * - Show which properties already have this doc linked
 * - Visual indicator for primary vs linked properties
 * - Confirmation before linking
 * - Glass effect backdrop
 *
 * Follows Zone B design system with zero hardcoded values.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Search, Home, Link as LinkIcon, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface PropertyForLinking {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  isLinked: boolean;
  isPrimary: boolean;
}

export interface LinkDocumentSheetProps {
  /** Document ID being linked */
  documentId: string;

  /** Current property ID (will be marked as primary) */
  currentPropertyId: string;

  /** Whether the sheet is visible */
  isVisible: boolean;

  /** Close handler */
  onClose: () => void;

  /** Handler when user confirms linking
   * @param propertyIds - Array of property IDs to link to
   */
  onLink: (propertyIds: string[]) => Promise<void>;

  /** Available properties to link to */
  properties: PropertyForLinking[];

  /** Whether linking is in progress */
  isLinking?: boolean;
}

export function LinkDocumentSheet({
  documentId,
  currentPropertyId,
  isVisible,
  onClose,
  onLink,
  properties,
  isLinking = false,
}: LinkDocumentSheetProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(
    new Set(properties.filter((p) => p.isLinked).map((p) => p.id))
  );

  // Filter properties by search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;

    const query = searchQuery.toLowerCase();
    return properties.filter((property) => {
      const fullAddress = `${property.address} ${property.city} ${property.state} ${property.zip}`.toLowerCase();
      return fullAddress.includes(query);
    });
  }, [properties, searchQuery]);

  // Handle property selection
  const togglePropertySelection = (propertyId: string) => {
    const newSelection = new Set(selectedPropertyIds);
    if (newSelection.has(propertyId)) {
      // Don't allow deselecting primary property
      if (propertyId !== currentPropertyId) {
        newSelection.delete(propertyId);
      }
    } else {
      newSelection.add(propertyId);
    }
    setSelectedPropertyIds(newSelection);
  };

  // Handle confirm
  const handleConfirm = async () => {
    await onLink(Array.from(selectedPropertyIds));
    onClose();
  };

  // Calculate changes
  const newLinks = Array.from(selectedPropertyIds).filter(
    (id) => !properties.find((p) => p.id === id)?.isLinked
  );
  const hasChanges = newLinks.length > 0 || selectedPropertyIds.size !== properties.filter((p) => p.isLinked).length;

  return (
    <BottomSheet
      visible={isVisible}
      onClose={onClose}
      title="Link Document to Properties"
      snapPoints={['75%']}
      useGlass={true}
      useGlassBackdrop={true}
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search properties by address..."
          style={{ marginBottom: SPACING.md }}
        />

        {/* Info Text */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: withOpacity(colors.info, 'subtle'),
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
            },
          ]}
        >
          <Text style={{ fontSize: 13, color: colors.foreground }}>
            Link this document to multiple properties in a package deal.
            {'\n'}
            <Text style={{ fontWeight: '600' }}>
              {properties.find((p) => p.id === currentPropertyId)?.address}
            </Text>{' '}
            will remain the primary property.
          </Text>
        </View>

        {/* Property List */}
        <ScrollView
          style={styles.propertyList}
          contentContainerStyle={{ paddingBottom: SPACING.lg }}
          showsVerticalScrollIndicator={false}
        >
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={32} color={colors.mutedForeground} />
              <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: SPACING.sm }}>
                No properties found
              </Text>
            </View>
          ) : (
            filteredProperties.map((property) => {
              const isSelected = selectedPropertyIds.has(property.id);
              const isPrimary = property.id === currentPropertyId;

              return (
                <TouchableOpacity
                  key={property.id}
                  onPress={() => togglePropertySelection(property.id)}
                  disabled={isPrimary}
                  activeOpacity={0.7}
                  style={[
                    styles.propertyItem,
                    {
                      backgroundColor: isSelected
                        ? withOpacity(colors.primary, 'muted')
                        : colors.card,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: BORDER_RADIUS.lg,
                      marginBottom: SPACING.sm,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected, disabled: isPrimary }}
                  accessibilityLabel={`${property.address}${isPrimary ? ' (Primary property)' : ''}`}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.propertyIcon,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : withOpacity(colors.muted, 'opaque'),
                        borderRadius: BORDER_RADIUS.md,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Check size={ICON_SIZES.lg} color={colors.primaryForeground} />
                    ) : (
                      <Home size={ICON_SIZES.lg} color={colors.mutedForeground} />
                    )}
                  </View>

                  {/* Address */}
                  <View style={styles.propertyInfo}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.foreground,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {property.address}
                    </Text>
                    {(property.city || property.state) && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.mutedForeground,
                        }}
                        numberOfLines={1}
                      >
                        {[property.city, property.state, property.zip].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>

                  {/* Badges */}
                  <View style={styles.propertyBadges}>
                    {isPrimary && (
                      <Badge variant="default" size="sm">
                        Primary
                      </Badge>
                    )}
                    {property.isLinked && !isPrimary && (
                      <Badge variant="outline" size="sm">
                        Linked
                      </Badge>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View
          style={[
            styles.footer,
            {
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: SPACING.md,
            },
          ]}
        >
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: SPACING.sm }}>
            {selectedPropertyIds.size} {selectedPropertyIds.size === 1 ? 'property' : 'properties'} selected
            {newLinks.length > 0 && ` • ${newLinks.length} new link${newLinks.length === 1 ? '' : 's'}`}
          </Text>

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }} disabled={isLinking}>
              Cancel
            </Button>
            <Button
              onPress={handleConfirm}
              style={{ flex: 1 }}
              disabled={!hasChanges || isLinking}
              loading={isLinking}
            >
              Link Document
            </Button>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  infoBox: {
    flexDirection: 'row',
  },
  propertyList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['4xl'],
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  footer: {
    paddingTop: SPACING.md,
  },
});
