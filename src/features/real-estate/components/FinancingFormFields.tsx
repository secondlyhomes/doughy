// src/features/real-estate/components/FinancingFormFields.tsx
// Form input fields for financing scenarios

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { DollarSign, Percent } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { LOAN_TYPES, LoanType } from '../hooks/useFinancingScenarios';
import { FinancingFormData, FinancingCalculations } from '../hooks/useFinancingForm';
import { formatCurrency } from '../utils/formatters';

interface FinancingFormFieldsProps {
  formData: FinancingFormData;
  errors: Record<string, string>;
  calculations: FinancingCalculations;
  onUpdateField: <K extends keyof FinancingFormData>(field: K, value: FinancingFormData[K]) => void;
}

const TERM_OPTIONS = [15, 20, 30];

export function FinancingFormFields({
  formData,
  errors,
  calculations,
  onUpdateField,
}: FinancingFormFieldsProps) {
  const colors = useThemeColors();
  return (
    <>
      {/* Scenario Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Scenario Name *</Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => onUpdateField('name', value)}
          placeholder="e.g., Conventional 20% Down"
          placeholderTextColor={colors.mutedForeground}
          className="rounded-lg px-3 py-3"
          style={{ backgroundColor: colors.muted, color: colors.foreground }}
        />
        {errors.name && <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.name}</Text>}
      </View>

      {/* Loan Type */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Loan Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOAN_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              onPress={() => onUpdateField('scenarioType', type.id)}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: formData.scenarioType === type.id ? colors.primary : colors.muted,
                borderColor: formData.scenarioType === type.id ? colors.primary : colors.border,
              }}
            >
              <Text
                className={`text-sm ${formData.scenarioType === type.id ? 'font-medium' : ''}`}
                style={{
                  color: formData.scenarioType === type.id ? colors.primaryForeground : colors.foreground,
                }}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Purchase Price */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Purchase Price *</Text>
        <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
          <DollarSign size={16} color={colors.mutedForeground} />
          <TextInput
            value={formData.purchasePrice}
            onChangeText={(value) => onUpdateField('purchasePrice', value)}
            placeholder="350000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3 text-lg font-semibold"
            style={{ color: colors.foreground }}
          />
        </View>
        {errors.purchasePrice && (
          <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.purchasePrice}</Text>
        )}
      </View>

      {/* Down Payment % */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Down Payment</Text>
        <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
          <TextInput
            value={formData.downPaymentPercent}
            onChangeText={(value) => onUpdateField('downPaymentPercent', value)}
            placeholder="20"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            className="flex-1 py-3"
            style={{ color: colors.foreground }}
          />
          <Text style={{ color: colors.mutedForeground }}>%</Text>
        </View>
        {calculations.purchasePrice > 0 && (
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            {formatCurrency(calculations.downPayment)} down • {formatCurrency(calculations.loanAmount)} loan
          </Text>
        )}
      </View>

      {/* Interest Rate & Term */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Interest Rate *</Text>
          <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
            <Percent size={14} color={colors.mutedForeground} />
            <TextInput
              value={formData.interestRate}
              onChangeText={(value) => onUpdateField('interestRate', value)}
              placeholder="7"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              className="flex-1 py-3 ml-1"
              style={{ color: colors.foreground }}
            />
          </View>
          {errors.interestRate && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.interestRate}</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Term (Years)</Text>
          <View className="flex-row gap-2">
            {TERM_OPTIONS.map(term => (
              <TouchableOpacity
                key={term}
                onPress={() => onUpdateField('loanTerm', term.toString())}
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor: formData.loanTerm === term.toString() ? colors.primary : colors.muted,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: formData.loanTerm === term.toString() ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Closing Costs */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Closing Costs (Optional)</Text>
        <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
          <DollarSign size={16} color={colors.mutedForeground} />
          <TextInput
            value={formData.closingCosts}
            onChangeText={(value) => onUpdateField('closingCosts', value)}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3"
            style={{ color: colors.foreground }}
          />
        </View>
      </View>

      {/* Notes */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Notes (Optional)</Text>
        <TextInput
          value={formData.notes}
          onChangeText={(value) => onUpdateField('notes', value)}
          placeholder="Additional notes about this scenario..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          className="rounded-lg px-3 py-3 min-h-[60]"
          style={{ backgroundColor: colors.muted, color: colors.foreground }}
        />
      </View>
    </>
  );
}
