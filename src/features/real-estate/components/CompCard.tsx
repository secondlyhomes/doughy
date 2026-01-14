// src/features/real-estate/components/CompCard.tsx
// Card component for displaying a comparable property
// Now uses DataCard for consistency

import React from 'react';
import { View, Text } from 'react-native';
import {
  Home,
  Bed,
  Bath,
  Square,
  Calendar,
  MapPin,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { DataCard, DataCardField, DataCardAction } from '@/components/ui';
import { PropertyComp } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

interface CompCardProps {
  comp: PropertyComp;
  onEdit?: (comp: PropertyComp) => void;
  onDelete?: (comp: PropertyComp) => void;
  subjectSqft?: number;
}

export function CompCard({ comp, onEdit, onDelete, subjectSqft }: CompCardProps) {
  const colors = useThemeColors();

  const sqft = comp.square_feet || comp.sqft || 0;
  const soldPrice = comp.sold_price || comp.salePrice || 0;
  const soldDate = comp.sold_date || comp.saleDate;
  const pricePerSqft = sqft > 0 ? soldPrice / sqft : 0;
  const yearBuilt = comp.year_built || comp.yearBuilt;
  const distance = comp.distance;

  // Calculate adjustment suggestion based on size difference
  const sizeDiff = subjectSqft && sqft ? subjectSqft - sqft : 0;
  const sizeAdjustment = sizeDiff !== 0 ? sizeDiff * pricePerSqft : 0;
  const adjustedPrice = soldPrice + sizeAdjustment;

  // Build fields array
  const fields: DataCardField[] = [
    ...(comp.bedrooms ? [{ icon: Bed, value: `${comp.bedrooms} bd` }] : []),
    ...(comp.bathrooms ? [{ icon: Bath, value: `${comp.bathrooms} ba` }] : []),
    ...(sqft > 0 ? [{ icon: Square, value: `${formatNumber(sqft)} sf` }] : []),
    ...(yearBuilt ? [{ icon: Calendar, value: String(yearBuilt) }] : []),
    ...((distance != null && distance > 0) ? [{ icon: MapPin, value: `${distance.toFixed(2)} mi` }] : []),
  ];

  // Build actions array
  const actions: DataCardAction[] = [
    ...(onEdit ? [{ icon: Edit2, label: 'Edit', onPress: () => onEdit(comp) }] : []),
    ...(onDelete ? [{ icon: Trash2, label: 'Delete', onPress: () => onDelete(comp), variant: 'destructive' as const }] : []),
  ];

  // Build footer content
  const footerContent = (
    <>
      {soldDate && (
        <View className="mb-2 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Sold: {formatDate(soldDate)}
          </Text>
        </View>
      )}

      {/* Size Adjustment (if subject property sqft provided) */}
      {subjectSqft && sizeDiff !== 0 && (
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Size Adjustment ({sizeDiff > 0 ? '+' : ''}{formatNumber(sizeDiff)} sf)
            </Text>
            <Text
              className="text-xs font-medium"
              style={{ color: sizeAdjustment >= 0 ? colors.success : colors.destructive }}
            >
              {sizeAdjustment >= 0 ? '+' : ''}{formatCurrency(Math.round(sizeAdjustment))}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-medium" style={{ color: colors.foreground }}>Adjusted Value</Text>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              {formatCurrency(Math.round(adjustedPrice))}
            </Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <DataCard
      title={comp.address}
      subtitle={`${comp.city}, ${comp.state} ${comp.zip}`}
      headerIcon={Home}
      highlightLabel="Sold Price"
      highlightValue={
        <View className="flex-row items-end justify-between w-full">
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            {formatCurrency(soldPrice)}
          </Text>
          {pricePerSqft > 0 && (
            <View className="items-end">
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Price/SqFt</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                {formatCurrency(Math.round(pricePerSqft))}/sf
              </Text>
            </View>
          )}
        </View>
      }
      highlightColor={colors.primary}
      fields={fields}
      actions={actions}
      footerContent={footerContent}
    />
  );
}
