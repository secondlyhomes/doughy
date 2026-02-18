// src/features/real-estate/hooks/useFinancingForm.ts
// Form state management for financing scenarios

import { useState, useCallback, useEffect } from 'react';
import { FinancingScenario } from '../types';
import { LoanType, calculateMonthlyPayment } from './useFinancingScenarios';

export interface FinancingFormData {
  name: string;
  scenarioType: LoanType;
  purchasePrice: string;
  downPaymentPercent: string;
  interestRate: string;
  loanTerm: string;
  closingCosts: string;
  notes: string;
}

export const initialFinancingFormData: FinancingFormData = {
  name: '',
  scenarioType: 'conventional',
  purchasePrice: '',
  downPaymentPercent: '20',
  interestRate: '7',
  loanTerm: '30',
  closingCosts: '',
  notes: '',
};

export interface FinancingCalculations {
  purchasePrice: number;
  downPaymentPercent: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  closingCosts: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  cashRequired: number;
}

function parseScenarioToForm(scenario: FinancingScenario): FinancingFormData {
  const input = (scenario.input_json || scenario.details || {}) as Record<string, unknown>;
  const price = (input.purchasePrice as number) || 0;
  const down = (input.downPayment as number) || 0;
  const downPct = price > 0 ? (down / price) * 100 : 20;

  return {
    name: scenario.name || '',
    scenarioType: (scenario.scenario_type as LoanType) || 'conventional',
    purchasePrice: price?.toString() || '',
    downPaymentPercent: downPct.toFixed(0),
    interestRate: (input.interestRate as number)?.toString() || '7',
    loanTerm: ((input.loanTerm as number) || (input.term as number) || 30).toString(),
    closingCosts: (input.closingCosts as number)?.toString() || '',
    notes: scenario.description || '',
  };
}

export function useFinancingForm(
  editScenario: FinancingScenario | null | undefined,
  defaultPurchasePrice?: number
) {
  const [formData, setFormData] = useState<FinancingFormData>(() => {
    if (editScenario) return parseScenarioToForm(editScenario);
    return { ...initialFinancingFormData, purchasePrice: defaultPurchasePrice?.toString() || '' };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editScenario) {
      setFormData(parseScenarioToForm(editScenario));
    } else {
      setFormData({ ...initialFinancingFormData, purchasePrice: defaultPurchasePrice?.toString() || '' });
    }
    setErrors({});
  }, [editScenario, defaultPurchasePrice]);

  const calculations: FinancingCalculations = {
    purchasePrice: parseFloat(formData.purchasePrice) || 0,
    downPaymentPercent: parseFloat(formData.downPaymentPercent) || 0,
    downPayment: 0,
    loanAmount: 0,
    interestRate: parseFloat(formData.interestRate) || 0,
    loanTerm: parseInt(formData.loanTerm) || 30,
    closingCosts: parseFloat(formData.closingCosts) || 0,
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    cashRequired: 0,
  };

  calculations.downPayment = Math.round(calculations.purchasePrice * (calculations.downPaymentPercent / 100));
  calculations.loanAmount = calculations.purchasePrice - calculations.downPayment;
  calculations.monthlyPayment = calculateMonthlyPayment(
    calculations.loanAmount,
    calculations.interestRate,
    calculations.loanTerm
  );
  calculations.totalPayments = calculations.monthlyPayment * calculations.loanTerm * 12;
  calculations.totalInterest = calculations.totalPayments - calculations.loanAmount;
  calculations.cashRequired = calculations.downPayment + calculations.closingCosts;

  const updateField = useCallback(<K extends keyof FinancingFormData>(field: K, value: FinancingFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.purchasePrice || calculations.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price is required';
    if (calculations.interestRate <= 0) newErrors.interestRate = 'Interest rate is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, calculations]);

  const reset = useCallback(() => {
    setFormData({ ...initialFinancingFormData, purchasePrice: defaultPurchasePrice?.toString() || '' });
    setErrors({});
  }, [defaultPurchasePrice]);

  return { formData, errors, calculations, updateField, validate, reset };
}
