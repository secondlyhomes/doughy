// src/features/real-estate/hooks/useFinancingScenarios.ts
// Hook for managing financing scenarios for a property

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FinancingScenario, ScenarioDetails } from '../types';

interface UseFinancingScenariosOptions {
  propertyId: string | null;
}

export interface FinancingScenarioWithCalcs extends FinancingScenario {
  calculatedPayment: number;
  totalInterest: number;
  totalCost: number;
  cashRequired: number;
}

interface UseFinancingScenariosReturn {
  scenarios: FinancingScenarioWithCalcs[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Default scenario details for fallback
const DEFAULT_SCENARIO_DETAILS: ScenarioDetails = {
  purchasePrice: null,
  loanAmount: null,
  interestRate: null,
};

/**
 * Validates that the input is a valid ScenarioDetails object.
 * Returns the validated object or a default if invalid.
 */
function validateScenarioDetails(input: unknown): ScenarioDetails {
  if (typeof input !== 'object' || input === null) {
    return { ...DEFAULT_SCENARIO_DETAILS };
  }

  const obj = input as Record<string, unknown>;

  // Helper to safely extract nullable number
  const getNumber = (key: string): number | null => {
    const val = obj[key];
    if (val === null || val === undefined) return null;
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    return null;
  };

  return {
    purchasePrice: getNumber('purchasePrice'),
    loanAmount: getNumber('loanAmount'),
    interestRate: getNumber('interestRate'),
    downPayment: getNumber('downPayment'),
    loanTerm: getNumber('loanTerm'),
    monthlyPayment: getNumber('monthlyPayment'),
    closingCosts: getNumber('closingCosts'),
    currentMortgageBalance: getNumber('currentMortgageBalance'),
    currentInterestRate: getNumber('currentInterestRate'),
    currentMonthlyPayment: getNumber('currentMonthlyPayment'),
    term: getNumber('term'),
    sellerIncentive: getNumber('sellerIncentive'),
    remainingYears: getNumber('remainingYears'),
    balloonPayment: getNumber('balloonPayment'),
    monthlyRent: getNumber('monthlyRent'),
    repairs: getNumber('repairs'),
    holdingCosts: getNumber('holdingCosts'),
    miscCosts: getNumber('miscCosts'),
    investorDiscount: getNumber('investorDiscount'),
    wholesaleFee: getNumber('wholesaleFee'),
    optionPrice: getNumber('optionPrice'),
    optionFee: getNumber('optionFee'),
    leaseTerm: getNumber('leaseTerm'),
  };
}

// Loan type options
export const LOAN_TYPES = [
  { id: 'conventional', label: 'Conventional' },
  { id: 'fha', label: 'FHA' },
  { id: 'va', label: 'VA' },
  { id: 'hard_money', label: 'Hard Money' },
  { id: 'private', label: 'Private Lender' },
  { id: 'seller_finance', label: 'Seller Finance' },
  { id: 'cash', label: 'Cash' },
] as const;

export type LoanType = typeof LOAN_TYPES[number]['id'];

/**
 * Calculate monthly mortgage payment (P&I)
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return loanAmount / (termYears * 12);

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  const payment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Hook for fetching financing scenarios for a property
 */
export function useFinancingScenarios({ propertyId }: UseFinancingScenariosOptions): UseFinancingScenariosReturn {
  const [scenarios, setScenarios] = useState<FinancingScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchScenarios = useCallback(async () => {
    if (!propertyId) {
      setScenarios([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('investor').from('financing_scenarios')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      // Convert Supabase records to typed FinancingScenario
      const typedScenarios: FinancingScenario[] = (data || []).map(record => ({
        ...record,
        input_json: record.input_json as ScenarioDetails | null,
        result_json: record.result_json as Record<string, unknown> | null,
      }));
      setScenarios(typedScenarios);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching financing scenarios:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  // Add calculations to each scenario
  const scenariosWithCalcs = useMemo((): FinancingScenarioWithCalcs[] => {
    return scenarios.map(scenario => {
      const details: ScenarioDetails = scenario.input_json || scenario.details || {
        purchasePrice: null,
        loanAmount: null,
        interestRate: null,
      };
      const loanAmount = details.loanAmount || 0;
      const interestRate = details.interestRate || 0;
      const loanTerm = details.loanTerm || details.term || 30;
      const downPayment = details.downPayment || 0;
      const purchasePrice = details.purchasePrice || 0;

      const calculatedPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
      const totalPayments = calculatedPayment * loanTerm * 12;
      const totalInterest = totalPayments - loanAmount;
      const totalCost = totalPayments + downPayment + (details.closingCosts || 0);
      const cashRequired = downPayment + (details.closingCosts || 0);

      return {
        ...scenario,
        calculatedPayment,
        totalInterest: Math.round(totalInterest),
        totalCost: Math.round(totalCost),
        cashRequired: Math.round(cashRequired),
      };
    });
  }, [scenarios]);

  return {
    scenarios: scenariosWithCalcs,
    isLoading,
    error,
    refetch: fetchScenarios,
  };
}

/**
 * Hook for financing scenario mutations
 */
export function useFinancingScenarioMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createScenario = useCallback(async (
    propertyId: string,
    data: {
      name: string;
      scenarioType: LoanType;
      purchasePrice: number;
      downPayment: number;
      loanAmount: number;
      interestRate: number;
      loanTerm: number;
      closingCosts?: number;
      notes?: string;
    }
  ): Promise<FinancingScenario | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const inputJson: ScenarioDetails = {
        purchasePrice: data.purchasePrice,
        loanAmount: data.loanAmount,
        interestRate: data.interestRate,
        downPayment: data.downPayment,
        loanTerm: data.loanTerm,
        closingCosts: data.closingCosts || 0,
        monthlyPayment: calculateMonthlyPayment(data.loanAmount, data.interestRate, data.loanTerm),
      };

      const insertData = {
        property_id: propertyId,
        name: data.name,
        description: data.notes || '',
        scenario_type: data.scenarioType,
        input_json: inputJson,
        result_json: {},
        pros_cons: '',
      };

      const { data: result, error: insertError } = await supabase
        .schema('investor').from('financing_scenarios')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Convert to typed FinancingScenario
      return {
        ...result,
        input_json: result.input_json as ScenarioDetails | null,
        result_json: result.result_json as Record<string, unknown> | null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating financing scenario:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateScenario = useCallback(async (
    scenarioId: string,
    data: Partial<{
      name: string;
      scenarioType: LoanType;
      purchasePrice: number;
      downPayment: number;
      loanAmount: number;
      interestRate: number;
      loanTerm: number;
      closingCosts: number;
      notes: string;
    }>
  ): Promise<FinancingScenario | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // First get the existing scenario
      const { data: existing, error: fetchError } = await supabase
        .schema('investor').from('financing_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (fetchError) throw fetchError;

      // Safely validate and extract scenario details from JSON
      const existingInput = validateScenarioDetails(existing.input_json);

      const updatedInput: ScenarioDetails = {
        ...existingInput,
        purchasePrice: data.purchasePrice ?? existingInput.purchasePrice,
        loanAmount: data.loanAmount ?? existingInput.loanAmount,
        interestRate: data.interestRate ?? existingInput.interestRate,
        downPayment: data.downPayment ?? existingInput.downPayment,
        loanTerm: data.loanTerm ?? existingInput.loanTerm,
        closingCosts: data.closingCosts ?? existingInput.closingCosts,
      };

      // Recalculate monthly payment
      updatedInput.monthlyPayment = calculateMonthlyPayment(
        updatedInput.loanAmount || 0,
        updatedInput.interestRate || 0,
        updatedInput.loanTerm || 30
      );

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        input_json: updatedInput,
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.scenarioType !== undefined) updateData.scenario_type = data.scenarioType;
      if (data.notes !== undefined) updateData.description = data.notes;

      const { data: result, error: updateError } = await supabase
        .schema('investor').from('financing_scenarios')
        .update(updateData)
        .eq('id', scenarioId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Convert to typed FinancingScenario
      return {
        ...result,
        input_json: result.input_json as ScenarioDetails | null,
        result_json: result.result_json as Record<string, unknown> | null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating financing scenario:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteScenario = useCallback(async (scenarioId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .schema('investor').from('financing_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting financing scenario:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createScenario,
    updateScenario,
    deleteScenario,
    isLoading,
    error,
  };
}
