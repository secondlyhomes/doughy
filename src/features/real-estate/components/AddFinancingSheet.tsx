// src/features/real-estate/components/AddFinancingSheet.tsx
// Focused sheet for adding/editing financing scenarios
// Uses FocusedSheet for reduced distraction on complex financial form

import React, { useCallback } from 'react';
import { View } from 'react-native';
import { FocusedSheet, FocusedSheetSection } from '@/components/ui';
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
    <FocusedSheet
      visible={visible}
      onClose={handleClose}
      title={editScenario ? 'Edit Scenario' : 'New Financing Scenario'}
      subtitle="Compare different loan options"
      doneLabel={editScenario ? 'Save Changes' : 'Create Scenario'}
      onDone={handleSubmit}
      isSubmitting={isLoading}
    >
      <FocusedSheetSection title="Loan Details">
        <FinancingFormFields
          formData={formData}
          errors={errors}
          calculations={calculations}
          onUpdateField={updateField}
        />
      </FocusedSheetSection>

      <FocusedSheetSection title="Payment Preview">
        <FinancingPreview calculations={calculations} />
      </FocusedSheetSection>

      <View className="h-4" />
    </FocusedSheet>
  );
}
