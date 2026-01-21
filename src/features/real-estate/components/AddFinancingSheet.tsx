// src/features/real-estate/components/AddFinancingSheet.tsx
// Bottom sheet for adding/editing financing scenarios

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, CreditCard } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet, Button } from '@/components/ui';
import { FinancingScenario } from '../types';
import { LoanType } from '../hooks/useFinancingScenarios';
import { useFinancingForm } from '../hooks/useFinancingForm';
import { FinancingFormFields } from './FinancingFormFields';
import { FinancingPreview } from './FinancingPreview';

interface AddFinancingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    scenarioType: LoanType;
    purchasePrice: number;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    closingCosts?: number;
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  editScenario?: FinancingScenario | null;
  defaultPurchasePrice?: number;
}

export function AddFinancingSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editScenario,
  defaultPurchasePrice,
}: AddFinancingSheetProps) {
  const colors = useThemeColors();
  const { formData, errors, calculations, updateField, validate, reset } = useFinancingForm(
    editScenario,
    defaultPurchasePrice
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    await onSubmit({
      name: formData.name.trim(),
      scenarioType: formData.scenarioType,
      purchasePrice: calculations.purchasePrice,
      downPayment: calculations.downPayment,
      loanAmount: calculations.loanAmount,
      interestRate: calculations.interestRate,
      loanTerm: calculations.loanTerm,
      closingCosts: calculations.closingCosts || undefined,
      notes: formData.notes.trim() || undefined,
    });
    reset();
  }, [formData, calculations, validate, onSubmit, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={['90%']}>
      {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {editScenario ? 'Edit Scenario' : 'New Financing Scenario'}
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Compare different loan options</Text>
          </View>
          <TouchableOpacity onPress={handleClose} className="p-2 rounded-full" style={{ backgroundColor: colors.muted }}>
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FinancingFormFields
            formData={formData}
            errors={errors}
            calculations={calculations}
            onUpdateField={updateField}
          />
          <FinancingPreview calculations={calculations} />
          <View className="h-4" />
        </ScrollView>

      {/* Submit Button */}
      <View className="p-4 border-t" style={{ borderColor: colors.border }}>
        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
          className="w-full"
        >
          {!isLoading && <CreditCard size={18} color={colors.primaryForeground} />}
          {editScenario ? 'Save Changes' : 'Create Scenario'}
        </Button>
      </View>
    </BottomSheet>
  );
}
