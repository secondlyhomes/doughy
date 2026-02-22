// src/features/portfolio/components/tabs/PortfolioDebtTab.tsx
// Debt tab showing mortgage details, amortization, payoff calculator

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { usePortfolioMortgages } from '../../hooks/usePortfolioMortgages';
import type { PortfolioMortgage } from '../../types';
import { MortgageSheet } from '../MortgageSheet';
import { PrimaryMortgageCard } from './PrimaryMortgageCard';
import { MonthlyPaymentCard } from './MonthlyPaymentCard';
import { AmortizationCard } from './AmortizationCard';
import { PayoffCalculatorCard } from './PayoffCalculatorCard';
import { OtherLoansCard } from './OtherLoansCard';
import { DebtSummaryCard } from './DebtSummaryCard';

interface PortfolioDebtTabProps {
  portfolioEntryId?: string;
}

export function PortfolioDebtTab({
  portfolioEntryId,
}: PortfolioDebtTabProps) {
  const colors = useThemeColors();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingMortgage, setEditingMortgage] = useState<PortfolioMortgage | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const {
    mortgages,
    primaryMortgage,
    totalDebt,
    totalMonthlyPayment,
    primaryAmortization,
    thisMonthBreakdown,
    extraPaymentScenarios,
    isLoading,
    createMortgage,
    updateMortgage,
    deleteMortgage,
    isCreating,
  } = usePortfolioMortgages(portfolioEntryId);

  const handleAddMortgage = useCallback(() => {
    setEditingMortgage(null);
    setShowAddSheet(true);
  }, []);

  const handleEditMortgage = useCallback((mortgage: PortfolioMortgage) => {
    setEditingMortgage(mortgage);
    setShowAddSheet(true);
  }, []);

  // Calculate payoff progress
  const payoffProgress = useMemo(() => {
    if (!primaryMortgage) return 0;
    const paid = primaryMortgage.original_balance - primaryMortgage.current_balance;
    return (paid / primaryMortgage.original_balance) * 100;
  }, [primaryMortgage]);

  if (!portfolioEntryId) {
    return (
      <View className="py-8 items-center">
        <Text style={{ color: colors.mutedForeground }}>
          No portfolio entry found.
        </Text>
      </View>
    );
  }

  return (
    <View className="py-4 gap-4 pb-6">
      {/* Primary Mortgage Card */}
      <PrimaryMortgageCard
        primaryMortgage={primaryMortgage}
        payoffProgress={payoffProgress}
        onEdit={handleEditMortgage}
        onAdd={handleAddMortgage}
      />

      {/* This Month's Payment Breakdown */}
      {primaryMortgage && thisMonthBreakdown && (
        <MonthlyPaymentCard breakdown={thisMonthBreakdown} />
      )}

      {/* Amortization Calculator */}
      {primaryMortgage && primaryAmortization && (
        <AmortizationCard
          amortization={primaryAmortization}
          onViewFullSchedule={() => setShowFullSchedule(true)}
        />
      )}

      {/* Payoff Calculator - Extra Payment Scenarios */}
      {primaryMortgage && extraPaymentScenarios.length > 0 && (
        <PayoffCalculatorCard scenarios={extraPaymentScenarios} />
      )}

      {/* Other Loans */}
      {mortgages.length > 1 && (
        <OtherLoansCard
          mortgages={mortgages}
          onEdit={handleEditMortgage}
          onAdd={handleAddMortgage}
        />
      )}

      {/* Total Debt Summary */}
      {mortgages.length > 0 && (
        <DebtSummaryCard
          totalDebt={totalDebt}
          totalMonthlyPayment={totalMonthlyPayment}
        />
      )}

      {/* Add button if has primary but no others */}
      {primaryMortgage && mortgages.length === 1 && (
        <Button
          variant="outline"
          size="sm"
          onPress={handleAddMortgage}
          className="self-center"
        >
          <Plus size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 4 }}>Add Another Loan</Text>
        </Button>
      )}

      {/* Mortgage Sheet */}
      <MortgageSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setEditingMortgage(null);
        }}
        portfolioEntryId={portfolioEntryId}
        existingMortgage={editingMortgage}
        onSubmit={async (data) => {
          if (editingMortgage) {
            await updateMortgage({ id: editingMortgage.id, updates: data });
          } else {
            await createMortgage(data);
          }
          setShowAddSheet(false);
          setEditingMortgage(null);
        }}
        onDelete={editingMortgage ? async () => {
          await deleteMortgage(editingMortgage.id);
          setShowAddSheet(false);
          setEditingMortgage(null);
        } : undefined}
        isLoading={isCreating}
      />
    </View>
  );
}

export default PortfolioDebtTab;
