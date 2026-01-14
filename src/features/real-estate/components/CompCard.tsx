// src/features/real-estate/components/CompCard.tsx
// Card component for displaying a comparable property
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Home,
  Bed,
  Bath,
  Square,
  Calendar,
  MapPin,
  DollarSign,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
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

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Header */}
      <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Home size={14} color={colors.mutedForeground} />
              <Text className="font-medium ml-2 flex-1" numberOfLines={1} style={{ color: colors.foreground }}>
                {comp.address}
              </Text>
            </View>
            <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
              {comp.city}, {comp.state} {comp.zip}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-2 ml-2">
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(comp)}
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <Edit2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(comp)}
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${colors.destructive}15` }}
              >
                <Trash2 size={14} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Price */}
      <View className="px-4 py-3" style={{ backgroundColor: `${colors.primary}08` }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Sold Price</Text>
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>
              {formatCurrency(soldPrice)}
            </Text>
          </View>
          {pricePerSqft > 0 && (
            <View className="items-end">
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Price/SqFt</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                {formatCurrency(Math.round(pricePerSqft))}/sf
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Details */}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-3">
          {comp.bedrooms && (
            <View className="flex-row items-center">
              <Bed size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.foreground }}>{comp.bedrooms} bd</Text>
            </View>
          )}
          {comp.bathrooms && (
            <View className="flex-row items-center">
              <Bath size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.foreground }}>{comp.bathrooms} ba</Text>
            </View>
          )}
          {sqft > 0 && (
            <View className="flex-row items-center">
              <Square size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.foreground }}>{formatNumber(sqft)} sf</Text>
            </View>
          )}
          {yearBuilt && (
            <View className="flex-row items-center">
              <Calendar size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.foreground }}>{yearBuilt}</Text>
            </View>
          )}
          {distance != null && distance > 0 && (
            <View className="flex-row items-center">
              <MapPin size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.foreground }}>{distance.toFixed(2)} mi</Text>
            </View>
          )}
        </View>

        {/* Sale Date */}
        {soldDate && (
          <View className="mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Sold: {formatDate(soldDate)}
            </Text>
          </View>
        )}

        {/* Size Adjustment (if subject property sqft provided) */}
        {subjectSqft && sizeDiff !== 0 && (
          <View className="mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <View className="flex-row justify-between items-center">
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
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-xs font-medium" style={{ color: colors.foreground }}>Adjusted Value</Text>
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                {formatCurrency(Math.round(adjustedPrice))}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
