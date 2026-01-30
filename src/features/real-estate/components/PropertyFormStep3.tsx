// src/features/real-estate/components/PropertyFormStep3.tsx
// Step 3: Pricing & Value (ARV, purchase price, repair cost)
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, Wrench, Target } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatCurrency } from '../utils/formatters';

export interface Step3Data {
  arv: string;
  purchase_price: string;
  repair_cost: string;
}

interface PropertyFormStep3Props {
  data: Step3Data;
  onChange: (data: Partial<Step3Data>) => void;
  errors: Partial<Record<keyof Step3Data, string>>;
}

export function PropertyFormStep3({ data, onChange, errors }: PropertyFormStep3Props) {
  const colors = useThemeColors();

  // Calculate deal metrics
  const arv = parseFloat(data.arv) || 0;
  const purchasePrice = parseFloat(data.purchase_price) || 0;
  const repairCost = parseFloat(data.repair_cost) || 0;
  const totalInvestment = purchasePrice + repairCost;
  const grossProfit = arv - totalInvestment;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const mao = arv * 0.7 - repairCost; // Maximum Allowable Offer (70% rule)

  const formatInputCurrency = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (!cleanValue) return '';
    return cleanValue;
  };

  // Note: This component is rendered inside PropertyFormWizard's ScrollView
  // so we use View instead of ScrollView to avoid nested scrolling issues
  return (
    <View className="flex-1">
      <View className="gap-4">
        {/* ARV */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <TrendingUp size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>After Repair Value (ARV)</Text>
          </View>

          <View
            className="flex-row items-center rounded-lg px-4"
            style={{ backgroundColor: colors.muted }}
          >
            <Text className="text-lg" style={{ color: colors.mutedForeground }}>$</Text>
            <TextInput
              value={data.arv}
              onChangeText={(value) => onChange({ arv: formatInputCurrency(value) })}
              placeholder="350,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="flex-1 py-3 ml-1 text-lg"
              style={{
                color: colors.foreground,
                borderBottomWidth: errors.arv ? 1 : 0,
                borderBottomColor: errors.arv ? colors.destructive : undefined,
              }}
            />
          </View>
          {errors.arv && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.arv}</Text>
          )}

          <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
            The estimated value of the property after all repairs are completed.
          </Text>

          {/* Quick select buttons */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {['150000', '200000', '250000', '300000', '350000', '400000', '500000'].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => onChange({ arv: value })}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: data.arv === value ? colors.primary : colors.muted,
                }}
              >
                <Text
                  className="text-xs"
                  style={{
                    color: data.arv === value ? colors.primaryForeground : colors.foreground,
                    fontWeight: data.arv === value ? '500' : '400',
                  }}
                >
                  {formatCurrency(parseInt(value))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Purchase Price */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <DollarSign size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Purchase Price</Text>
          </View>

          <View
            className="flex-row items-center rounded-lg px-4"
            style={{ backgroundColor: colors.muted }}
          >
            <Text className="text-lg" style={{ color: colors.mutedForeground }}>$</Text>
            <TextInput
              value={data.purchase_price}
              onChangeText={(value) => onChange({ purchase_price: formatInputCurrency(value) })}
              placeholder="280,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="flex-1 py-3 ml-1 text-lg"
              style={{
                color: colors.foreground,
                borderBottomWidth: errors.purchase_price ? 1 : 0,
                borderBottomColor: errors.purchase_price ? colors.destructive : undefined,
              }}
            />
          </View>
          {errors.purchase_price && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.purchase_price}</Text>
          )}

          <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
            The price you're paying or planning to pay for the property.
          </Text>
        </View>

        {/* Repair Cost */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <Wrench size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Estimated Repair Cost</Text>
          </View>

          <View
            className="flex-row items-center rounded-lg px-4"
            style={{ backgroundColor: colors.muted }}
          >
            <Text className="text-lg" style={{ color: colors.mutedForeground }}>$</Text>
            <TextInput
              value={data.repair_cost}
              onChangeText={(value) => onChange({ repair_cost: formatInputCurrency(value) })}
              placeholder="25,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="flex-1 py-3 ml-1 text-lg"
              style={{
                color: colors.foreground,
                borderBottomWidth: errors.repair_cost ? 1 : 0,
                borderBottomColor: errors.repair_cost ? colors.destructive : undefined,
              }}
            />
          </View>
          {errors.repair_cost && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.repair_cost}</Text>
          )}

          <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
            Total estimated cost for repairs and renovations.
          </Text>

          {/* Quick presets */}
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '10000' })}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.muted }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.foreground }}>Light</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>~$10k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '30000' })}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.muted }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.foreground }}>Medium</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>~$30k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '60000' })}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.muted }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.foreground }}>Heavy</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>~$60k</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deal Analysis Summary */}
        {(arv > 0 || purchasePrice > 0) && (
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: withOpacity(colors.primary, 'muted'),
              borderWidth: 1,
              borderColor: withOpacity(colors.primary, 'strong'),
            }}
          >
            <View className="flex-row items-center mb-3">
              <Target size={18} color={colors.primary} />
              <Text className="text-lg font-semibold ml-2" style={{ color: colors.primary }}>Deal Analysis</Text>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text style={{ color: colors.foreground }}>Total Investment</Text>
                <Text className="font-medium" style={{ color: colors.foreground }}>{formatCurrency(totalInvestment)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.foreground }}>Gross Profit</Text>
                <Text
                  className="font-semibold"
                  style={{ color: grossProfit >= 0 ? colors.success : colors.destructive }}
                >
                  {formatCurrency(grossProfit)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.foreground }}>ROI</Text>
                <Text
                  className="font-semibold"
                  style={{ color: roi >= 0 ? colors.success : colors.destructive }}
                >
                  {roi.toFixed(1)}%
                </Text>
              </View>
              <View className="h-px my-2" style={{ backgroundColor: withOpacity(colors.primary, 'strong') }} />
              <View className="flex-row justify-between">
                <Text className="font-medium" style={{ color: colors.primary }}>Max Offer (70% Rule)</Text>
                <Text className="font-bold" style={{ color: colors.primary }}>{formatCurrency(mao)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info note */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            These values help calculate profitability. You can update them later from the property detail screen.
          </Text>
        </View>
      </View>
    </View>
  );
}
