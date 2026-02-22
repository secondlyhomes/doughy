// src/features/property-inventory/screens/inventory-detail/InventoryDetailCards.tsx
// Detail cards: Product Details, Dates & Warranty, Financial, Notes

import React from 'react';
import { View, Text } from 'react-native';
import {
  Calendar,
  DollarSign,
  Info,
  Tag,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DetailRow, Separator } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import type { InventoryItem } from '../../types';
import { formatCurrency, formatDate } from './utils';
import type { WarrantyStatus } from './utils';

export interface InventoryDetailCardsProps {
  item: InventoryItem;
  warrantyStatus: WarrantyStatus;
}

function CardTitle({ children }: { children: string }) {
  const colors = useThemeColors();
  return (
    <Text
      style={{
        color: colors.foreground,
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

export function ProductDetailsCard({ item }: { item: InventoryItem }) {
  const colors = useThemeColors();
  return (
    <View
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <CardTitle>Product Details</CardTitle>

      <DetailRow icon={Tag} label="Brand" value={item.brand} />
      <Separator />
      <DetailRow icon={Info} label="Model" value={item.model} />
      <Separator />
      <DetailRow icon={Tag} label="Serial Number" value={item.serial_number} />
    </View>
  );
}

export function DatesWarrantyCard({
  item,
  warrantyStatus,
}: {
  item: InventoryItem;
  warrantyStatus: WarrantyStatus;
}) {
  const colors = useThemeColors();
  return (
    <View
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <CardTitle>Dates & Warranty</CardTitle>

      <DetailRow
        icon={Calendar}
        label="Purchase Date"
        value={formatDate(item.purchase_date)}
      />
      <Separator />
      <DetailRow
        icon={Calendar}
        label="Install Date"
        value={formatDate(item.install_date)}
      />
      <Separator />
      <DetailRow
        icon={Calendar}
        label="Warranty Expires"
        value={formatDate(item.warranty_expires)}
        valueColor={
          warrantyStatus === 'expired'
            ? colors.destructive
            : warrantyStatus === 'expiring'
            ? colors.warning
            : undefined
        }
      />
      <Separator />
      <DetailRow
        icon={Calendar}
        label="Last Inspected"
        value={formatDate(item.last_inspected_at)}
      />
    </View>
  );
}

export function FinancialCard({ item }: { item: InventoryItem }) {
  const colors = useThemeColors();
  return (
    <View
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <CardTitle>Financial</CardTitle>

      <DetailRow
        icon={DollarSign}
        label="Purchase Price"
        value={formatCurrency(item.purchase_price)}
      />
      <Separator />
      <DetailRow
        icon={DollarSign}
        label="Replacement Cost"
        value={formatCurrency(item.replacement_cost)}
      />
    </View>
  );
}

export function NotesCard({ item }: { item: InventoryItem }) {
  const colors = useThemeColors();

  if (!item.notes && !item.inspection_notes) return null;

  return (
    <View
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: colors.card }}
    >
      <CardTitle>Notes</CardTitle>

      {item.notes && (
        <Text
          style={{
            color: colors.foreground,
            fontSize: FONT_SIZES.sm,
            lineHeight: 20,
          }}
        >
          {item.notes}
        </Text>
      )}

      {item.inspection_notes && (
        <View className="mt-3">
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
              marginBottom: 4,
            }}
          >
            Inspection Notes
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.sm,
              lineHeight: 20,
            }}
          >
            {item.inspection_notes}
          </Text>
        </View>
      )}
    </View>
  );
}

export function InventoryDetailCards({
  item,
  warrantyStatus,
}: InventoryDetailCardsProps) {
  return (
    <>
      <ProductDetailsCard item={item} />
      <DatesWarrantyCard item={item} warrantyStatus={warrantyStatus} />
      <FinancialCard item={item} />
      <NotesCard item={item} />
    </>
  );
}
