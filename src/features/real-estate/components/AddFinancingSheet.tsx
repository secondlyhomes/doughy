// src/features/real-estate/components/AddFinancingSheet.tsx
// Bottom sheet for adding/editing financing scenarios

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, DollarSign, Percent, Calendar, CreditCard, Calculator } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FinancingScenario } from '../types';
import { LOAN_TYPES, LoanType, calculateMonthlyPayment } from '../hooks/useFinancingScenarios';
import { formatCurrency } from '../utils/formatters';

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

interface FormData {
  name: string;
  scenarioType: LoanType;
  purchasePrice: string;
  downPaymentPercent: string;
  interestRate: string;
  loanTerm: string;
  closingCosts: string;
  notes: string;
}

const initialFormData: FormData = {
  name: '',
  scenarioType: 'conventional',
  purchasePrice: '',
  downPaymentPercent: '20',
  interestRate: '7',
  loanTerm: '30',
  closingCosts: '',
  notes: '',
};

const TERM_OPTIONS = [15, 20, 30];

export function AddFinancingSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editScenario,
  defaultPurchasePrice,
}: AddFinancingSheetProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (editScenario) {
      // Safely cast input_json to a record for property access
      const input = (editScenario.input_json || editScenario.details || {}) as Record<string, unknown>;
      const purchasePrice = (input.purchasePrice as number) || 0;
      const downPayment = (input.downPayment as number) || 0;
      const downPaymentPercent = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 20;

      return {
        name: editScenario.name || '',
        scenarioType: (editScenario.scenario_type as LoanType) || 'conventional',
        purchasePrice: purchasePrice?.toString() || '',
        downPaymentPercent: downPaymentPercent.toFixed(0),
        interestRate: (input.interestRate as number)?.toString() || '7',
        loanTerm: ((input.loanTerm as number) || (input.term as number) || 30).toString(),
        closingCosts: (input.closingCosts as number)?.toString() || '',
        notes: editScenario.description || '',
      };
    }
    return {
      ...initialFormData,
      purchasePrice: defaultPurchasePrice?.toString() || '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when editScenario prop changes (switching between different scenarios)
  useEffect(() => {
    if (editScenario) {
      // Safely cast input_json to a record for property access
      const input = (editScenario.input_json || editScenario.details || {}) as Record<string, unknown>;
      const price = (input.purchasePrice as number) || 0;
      const down = (input.downPayment as number) || 0;
      const downPct = price > 0 ? (down / price) * 100 : 20;

      setFormData({
        name: editScenario.name || '',
        scenarioType: (editScenario.scenario_type as LoanType) || 'conventional',
        purchasePrice: price?.toString() || '',
        downPaymentPercent: downPct.toFixed(0),
        interestRate: (input.interestRate as number)?.toString() || '7',
        loanTerm: ((input.loanTerm as number) || (input.term as number) || 30).toString(),
        closingCosts: (input.closingCosts as number)?.toString() || '',
        notes: editScenario.description || '',
      });
    } else {
      setFormData({
        ...initialFormData,
        purchasePrice: defaultPurchasePrice?.toString() || '',
      });
    }
    setErrors({});
  }, [editScenario, defaultPurchasePrice]);

  // Calculate derived values
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const downPaymentPercent = parseFloat(formData.downPaymentPercent) || 0;
  const downPayment = Math.round(purchasePrice * (downPaymentPercent / 100));
  const loanAmount = purchasePrice - downPayment;
  const interestRate = parseFloat(formData.interestRate) || 0;
  const loanTerm = parseInt(formData.loanTerm) || 30;
  const closingCosts = parseFloat(formData.closingCosts) || 0;

  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
  const totalPayments = monthlyPayment * loanTerm * 12;
  const totalInterest = totalPayments - loanAmount;
  const cashRequired = downPayment + closingCosts;

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.purchasePrice || purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price is required';
    }
    if (interestRate <= 0) {
      newErrors.interestRate = 'Interest rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, purchasePrice, interestRate]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    await onSubmit({
      name: formData.name.trim(),
      scenarioType: formData.scenarioType,
      purchasePrice,
      downPayment,
      loanAmount,
      interestRate,
      loanTerm,
      closingCosts: closingCosts || undefined,
      notes: formData.notes.trim() || undefined,
    });
    setFormData({
      ...initialFormData,
      purchasePrice: defaultPurchasePrice?.toString() || '',
    });
  }, [formData, validate, onSubmit, purchasePrice, downPayment, loanAmount, interestRate, loanTerm, closingCosts, defaultPurchasePrice]);

  const handleClose = useCallback(() => {
    setFormData({
      ...initialFormData,
      purchasePrice: defaultPurchasePrice?.toString() || '',
    });
    setErrors({});
    onClose();
  }, [onClose, defaultPurchasePrice]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['90%']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {editScenario ? 'Edit Scenario' : 'New Financing Scenario'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Compare different loan options
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 bg-muted rounded-full"
          >
            <X size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Scenario Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">Scenario Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="e.g., Conventional 20% Down"
              placeholderTextColor="#9CA3AF"
              className="bg-muted rounded-lg px-3 py-3 text-foreground"
            />
            {errors.name && (
              <Text className="text-xs text-destructive mt-1">{errors.name}</Text>
            )}
          </View>

          {/* Loan Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Loan Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {LOAN_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => updateField('scenarioType', type.id)}
                  className={`px-3 py-2 rounded-lg border ${
                    formData.scenarioType === type.id
                      ? 'bg-primary border-primary'
                      : 'bg-muted border-border'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.scenarioType === type.id
                        ? 'text-primary-foreground font-medium'
                        : 'text-foreground'
                    }`}
                  >
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
                onChangeText={(value) => updateField('purchasePrice', value)}
                placeholder="350000"
                placeholderTextColor="#9CA3AF"
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
                onChangeText={(value) => updateField('downPaymentPercent', value)}
                placeholder="20"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                className="flex-1 py-3 text-foreground"
              />
              <Text className="text-muted-foreground">%</Text>
            </View>
            {purchasePrice > 0 && (
              <Text className="text-xs text-muted-foreground mt-1">
                {formatCurrency(downPayment)} down • {formatCurrency(loanAmount)} loan
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
                  onChangeText={(value) => updateField('interestRate', value)}
                  placeholder="7"
                  placeholderTextColor="#9CA3AF"
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
                    onPress={() => updateField('loanTerm', term.toString())}
                    className={`flex-1 py-3 rounded-lg items-center ${
                      formData.loanTerm === term.toString()
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        formData.loanTerm === term.toString()
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }`}
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
            <Text className="text-sm font-medium text-foreground mb-1.5">Closing Costs (Optional)</Text>
            <View className="flex-row items-center bg-muted rounded-lg px-3">
              <DollarSign size={16} className="text-muted-foreground" />
              <TextInput
                value={formData.closingCosts}
                onChangeText={(value) => updateField('closingCosts', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
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
              onChangeText={(value) => updateField('notes', value)}
              placeholder="Additional notes about this scenario..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              className="bg-muted rounded-lg px-3 py-3 text-foreground min-h-[60]"
            />
          </View>

          {/* Calculation Preview */}
          {purchasePrice > 0 && loanAmount > 0 && (
            <View className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-6">
              <View className="flex-row items-center mb-3">
                <Calculator size={16} className="text-primary" />
                <Text className="text-sm font-semibold text-foreground ml-2">Payment Preview</Text>
              </View>

              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted-foreground">Monthly Payment (P&I)</Text>
                <Text className="text-lg font-bold text-primary">{formatCurrency(monthlyPayment)}</Text>
              </View>

              <View className="h-px bg-border my-2" />

              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Loan Amount</Text>
                  <Text className="text-xs text-foreground">{formatCurrency(loanAmount)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Total Interest</Text>
                  <Text className="text-xs text-foreground">{formatCurrency(totalInterest)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Cash Required at Close</Text>
                  <Text className="text-xs text-foreground">{formatCurrency(cashRequired)}</Text>
                </View>
              </View>
            </View>
          )}

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
