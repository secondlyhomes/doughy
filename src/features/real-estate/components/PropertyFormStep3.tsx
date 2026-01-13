// src/features/real-estate/components/PropertyFormStep3.tsx
// Step 3: Pricing & Value (ARV, purchase price, repair cost)

import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, Wrench, Target } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
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

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* ARV */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <TrendingUp size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">After Repair Value (ARV)</Text>
          </View>

          <View className="flex-row items-center bg-muted rounded-lg px-4">
            <Text className="text-lg text-muted-foreground">$</Text>
            <TextInput
              value={data.arv}
              onChangeText={(value) => onChange({ arv: formatInputCurrency(value) })}
              placeholder="350,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className={`flex-1 py-3 ml-1 text-foreground text-lg ${
                errors.arv ? 'border-b border-destructive' : ''
              }`}
            />
          </View>
          {errors.arv && (
            <Text className="text-xs text-destructive mt-1">{errors.arv}</Text>
          )}

          <Text className="text-xs text-muted-foreground mt-2">
            The estimated value of the property after all repairs are completed.
          </Text>

          {/* Quick select buttons */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {['150000', '200000', '250000', '300000', '350000', '400000', '500000'].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => onChange({ arv: value })}
                className={`px-3 py-1.5 rounded-full ${
                  data.arv === value ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={`text-xs ${
                    data.arv === value ? 'text-primary-foreground font-medium' : 'text-foreground'
                  }`}
                >
                  {formatCurrency(parseInt(value))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Purchase Price */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <DollarSign size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Purchase Price</Text>
          </View>

          <View className="flex-row items-center bg-muted rounded-lg px-4">
            <Text className="text-lg text-muted-foreground">$</Text>
            <TextInput
              value={data.purchase_price}
              onChangeText={(value) => onChange({ purchase_price: formatInputCurrency(value) })}
              placeholder="280,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className={`flex-1 py-3 ml-1 text-foreground text-lg ${
                errors.purchase_price ? 'border-b border-destructive' : ''
              }`}
            />
          </View>
          {errors.purchase_price && (
            <Text className="text-xs text-destructive mt-1">{errors.purchase_price}</Text>
          )}

          <Text className="text-xs text-muted-foreground mt-2">
            The price you're paying or planning to pay for the property.
          </Text>
        </View>

        {/* Repair Cost */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <Wrench size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Estimated Repair Cost</Text>
          </View>

          <View className="flex-row items-center bg-muted rounded-lg px-4">
            <Text className="text-lg text-muted-foreground">$</Text>
            <TextInput
              value={data.repair_cost}
              onChangeText={(value) => onChange({ repair_cost: formatInputCurrency(value) })}
              placeholder="25,000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className={`flex-1 py-3 ml-1 text-foreground text-lg ${
                errors.repair_cost ? 'border-b border-destructive' : ''
              }`}
            />
          </View>
          {errors.repair_cost && (
            <Text className="text-xs text-destructive mt-1">{errors.repair_cost}</Text>
          )}

          <Text className="text-xs text-muted-foreground mt-2">
            Total estimated cost for repairs and renovations.
          </Text>

          {/* Quick presets */}
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '10000' })}
              className="flex-1 bg-muted py-2 rounded-lg items-center"
            >
              <Text className="text-xs text-foreground font-medium">Light</Text>
              <Text className="text-xs text-muted-foreground">~$10k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '30000' })}
              className="flex-1 bg-muted py-2 rounded-lg items-center"
            >
              <Text className="text-xs text-foreground font-medium">Medium</Text>
              <Text className="text-xs text-muted-foreground">~$30k</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange({ repair_cost: '60000' })}
              className="flex-1 bg-muted py-2 rounded-lg items-center"
            >
              <Text className="text-xs text-foreground font-medium">Heavy</Text>
              <Text className="text-xs text-muted-foreground">~$60k</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deal Analysis Summary */}
        {(arv > 0 || purchasePrice > 0) && (
          <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <View className="flex-row items-center mb-3">
              <Target size={18} className="text-primary" />
              <Text className="text-lg font-semibold text-primary ml-2">Deal Analysis</Text>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-foreground">Total Investment</Text>
                <Text className="text-foreground font-medium">{formatCurrency(totalInvestment)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-foreground">Gross Profit</Text>
                <Text className={`font-semibold ${grossProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(grossProfit)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-foreground">ROI</Text>
                <Text className={`font-semibold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {roi.toFixed(1)}%
                </Text>
              </View>
              <View className="h-px bg-primary/20 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-primary font-medium">Max Offer (70% Rule)</Text>
                <Text className="text-primary font-bold">{formatCurrency(mao)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info note */}
        <View className="bg-muted rounded-xl p-4">
          <Text className="text-sm text-muted-foreground">
            These values help calculate profitability. You can update them later from the property detail screen.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
