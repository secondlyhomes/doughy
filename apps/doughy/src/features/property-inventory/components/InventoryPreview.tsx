// src/features/property-inventory/components/InventoryPreview.tsx
// Inline inventory preview for property detail tabs
// Shows top items grouped by category with a "See All" button

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Package,
  Thermometer,
  Hammer,
  Droplets,
  Sofa,
  Tv,
  MoreHorizontal,
  ChevronRight,
  LucideIcon,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { SPACING, FONT_SIZES, ICON_SIZES, BORDER_RADIUS, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  InventoryItem,
  InventoryCategory,
  INVENTORY_CATEGORY_LABELS,
} from '../types';

const MAX_PREVIEW_ITEMS = 6;

interface InventoryPreviewProps {
  items: InventoryItem[];
  totalCount: number;
  isLoading?: boolean;
  onSeeAll: () => void;
  onItemPress?: (item: InventoryItem) => void;
}

// Get icon for inventory category
function getCategoryIcon(category: InventoryCategory): LucideIcon {
  switch (category) {
    case 'appliance':
      return Package;
    case 'hvac':
      return Thermometer;
    case 'structure':
      return Hammer;
    case 'plumbing':
      return Droplets;
    case 'furniture':
      return Sofa;
    case 'electronics':
      return Tv;
    default:
      return MoreHorizontal;
  }
}

interface CategoryGroupProps {
  category: InventoryCategory;
  items: InventoryItem[];
  onItemPress?: (item: InventoryItem) => void;
}

function CategoryGroup({ category, items, onItemPress }: CategoryGroupProps) {
  const colors = useThemeColors();
  const Icon = getCategoryIcon(category);

  return (
    <View style={styles.categoryGroup}>
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <Icon size={ICON_SIZES.sm} color={colors.mutedForeground} />
        <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
          {INVENTORY_CATEGORY_LABELS[category]}
        </Text>
      </View>

      {/* Item Chips */}
      <View style={styles.itemChips}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onItemPress?.(item)}
            activeOpacity={PRESS_OPACITY.DEFAULT}
            style={[
              styles.itemChip,
              { backgroundColor: withOpacity(colors.primary, 'subtle') },
            ]}
          >
            <Text
              style={[styles.itemChipText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function InventoryPreview({
  items,
  totalCount,
  isLoading,
  onSeeAll,
  onItemPress,
}: InventoryPreviewProps) {
  const colors = useThemeColors();

  // Group items by category
  const groupedItems = items.slice(0, MAX_PREVIEW_ITEMS).reduce<Record<InventoryCategory, InventoryItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<InventoryCategory, InventoryItem[]>
  );

  // Get non-empty categories
  const categories = Object.entries(groupedItems).filter(
    ([_, categoryItems]) => categoryItems.length > 0
  ) as [InventoryCategory, InventoryItem[]][];

  // Loading state
  if (isLoading) {
    return (
      <Card style={{ padding: SPACING.lg }}>
        <View style={styles.emptyState}>
          <Package size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Loading inventory...
          </Text>
        </View>
      </Card>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card style={{ padding: SPACING.lg }}>
        <View style={styles.emptyState}>
          <Package size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No inventory items
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            Add appliances, furniture, and other items to track
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={PRESS_OPACITY.DEFAULT}
          style={[styles.seeAllButton, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            Add Inventory
          </Text>
          <ChevronRight size={ICON_SIZES.ml} color={colors.primary} />
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Card style={{ overflow: 'hidden' }}>
      {/* Category Groups */}
      <View style={{ padding: SPACING.md }}>
        {categories.map(([category, categoryItems]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={categoryItems}
            onItemPress={onItemPress}
          />
        ))}
      </View>

      {/* See All Button */}
      <TouchableOpacity
        onPress={onSeeAll}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        style={[styles.seeAllButton, { borderTopColor: colors.border }]}
      >
        <Text style={[styles.seeAllText, { color: colors.primary }]}>
          See All ({totalCount})
        </Text>
        <ChevronRight size={ICON_SIZES.ml} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  categoryGroup: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  itemChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  itemChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default InventoryPreview;
