// src/features/real-estate/components/FinancingFormFields.tsx
// Form input fields for financing scenarios
// Refactored to use FormField component (Phase 2 Migration)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, Percent, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FormField } from '@/components/ui';
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
      <FormField
        label="Scenario Name"
        value={formData.name}
        onChangeText={(value) => onUpdateField('name', value)}
        error={errors.name}
        placeholder="e.g., Conventional 20% Down"
        required
        icon={FileText}
      />

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
      <FormField
        label="Purchase Price"
        value={formData.purchasePrice}
        onChangeText={(value) => onUpdateField('purchasePrice', value)}
        error={errors.purchasePrice}
        placeholder="350000"
        keyboardType="numeric"
        icon={DollarSign}
        required
      />

      {/* Down Payment % */}
      <FormField
        label="Down Payment"
        value={formData.downPaymentPercent}
        onChangeText={(value) => onUpdateField('downPaymentPercent', value)}
        placeholder="20"
        keyboardType="decimal-pad"
        suffix="%"
        helperText={
          calculations.purchasePrice > 0
            ? `${formatCurrency(calculations.downPayment)} down • ${formatCurrency(calculations.loanAmount)} loan`
            : undefined
        }
      />

      {/* Interest Rate & Term */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <FormField
            label="Interest Rate"
            value={formData.interestRate}
            onChangeText={(value) => onUpdateField('interestRate', value)}
            error={errors.interestRate}
            placeholder="7"
            keyboardType="decimal-pad"
            icon={Percent}
            required
          />
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
      <FormField
        label="Closing Costs"
        value={formData.closingCosts}
        onChangeText={(value) => onUpdateField('closingCosts', value)}
        placeholder="0"
        keyboardType="numeric"
        icon={DollarSign}
        helperText="Optional"
      />

      {/* Notes */}
      <FormField
        label="Notes"
        value={formData.notes}
        onChangeText={(value) => onUpdateField('notes', value)}
        placeholder="Additional notes about this scenario..."
        multiline
        numberOfLines={2}
        helperText="Optional"
      />
    </>
  );
}
