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
        <Text className="text-sm font-medium text-foreground mb-1.5">Scenario Name *</Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => onUpdateField('name', value)}
          placeholder="e.g., Conventional 20% Down"
          placeholderTextColor={colors.mutedForeground}
          className="bg-muted rounded-lg px-3 py-3 text-foreground"
        />
        {errors.name && <Text className="text-xs text-destructive mt-1">{errors.name}</Text>}
      </View>

      {/* Loan Type */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Loan Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOAN_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              onPress={() => onUpdateField('scenarioType', type.id)}
              className={`px-3 py-2 rounded-lg border ${
                formData.scenarioType === type.id
                  ? 'bg-primary border-primary'
                  : 'bg-muted border-border'
              }`}
            >
              <Text className={`text-sm ${
                formData.scenarioType === type.id
                  ? 'text-primary-foreground font-medium'
                  : 'text-foreground'
              }`}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Purchase Price */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-1.5">Purchase Price *</Text>
        <View className="flex-row items-center bg-muted rounded-lg px-3">
          <DollarSign size={16} className="text-muted-foreground" />
          <TextInput
            value={formData.purchasePrice}
            onChangeText={(value) => onUpdateField('purchasePrice', value)}
            placeholder="350000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3 text-foreground text-lg font-semibold"
          />
        </View>
        {errors.purchasePrice && (
          <Text className="text-xs text-destructive mt-1">{errors.purchasePrice}</Text>
        )}
      </View>

      {/* Down Payment % */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-1.5">Down Payment</Text>
        <View className="flex-row items-center bg-muted rounded-lg px-3">
          <TextInput
            value={formData.downPaymentPercent}
            onChangeText={(value) => onUpdateField('downPaymentPercent', value)}
            placeholder="20"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            className="flex-1 py-3 text-foreground"
          />
          <Text className="text-muted-foreground">%</Text>
        </View>
        {calculations.purchasePrice > 0 && (
          <Text className="text-xs text-muted-foreground mt-1">
            {formatCurrency(calculations.downPayment)} down • {formatCurrency(calculations.loanAmount)} loan
          </Text>
        )}
      </View>

      {/* Interest Rate & Term */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground mb-1.5">Interest Rate *</Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3">
            <Percent size={14} className="text-muted-foreground" />
            <TextInput
              value={formData.interestRate}
              onChangeText={(value) => onUpdateField('interestRate', value)}
              placeholder="7"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              className="flex-1 py-3 text-foreground ml-1"
            />
          </View>
          {errors.interestRate && (
            <Text className="text-xs text-destructive mt-1">{errors.interestRate}</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground mb-1.5">Term (Years)</Text>
          <View className="flex-row gap-2">
            {TERM_OPTIONS.map(term => (
              <TouchableOpacity
                key={term}
                onPress={() => onUpdateField('loanTerm', term.toString())}
                className={`flex-1 py-3 rounded-lg items-center ${
                  formData.loanTerm === term.toString() ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  formData.loanTerm === term.toString()
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }`}>
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Closing Costs */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-1.5">Closing Costs (Optional)</Text>
        <View className="flex-row items-center bg-muted rounded-lg px-3">
          <DollarSign size={16} className="text-muted-foreground" />
          <TextInput
            value={formData.closingCosts}
            onChangeText={(value) => onUpdateField('closingCosts', value)}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3 text-foreground"
          />
        </View>
      </View>

      {/* Notes */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-1.5">Notes (Optional)</Text>
        <TextInput
          value={formData.notes}
          onChangeText={(value) => onUpdateField('notes', value)}
          placeholder="Additional notes about this scenario..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          className="bg-muted rounded-lg px-3 py-3 text-foreground min-h-[60]"
        />
      </View>
    </>
  );
}
