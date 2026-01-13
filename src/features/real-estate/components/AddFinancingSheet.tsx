// src/features/real-estate/components/AddFinancingSheet.tsx
// Bottom sheet for adding/editing financing scenarios

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { X, CreditCard } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {editScenario ? 'Edit Scenario' : 'New Financing Scenario'}
            </Text>
            <Text className="text-xs text-muted-foreground">Compare different loan options</Text>
          </View>
          <TouchableOpacity onPress={handleClose} className="p-2 bg-muted rounded-full">
            <X size={20} className="text-foreground" />
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
        <View className="p-4 border-t border-border">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-primary py-3.5 rounded-xl flex-row items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CreditCard size={18} color="white" />
                <Text className="text-primary-foreground font-semibold ml-2">
                  {editScenario ? 'Save Changes' : 'Create Scenario'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
