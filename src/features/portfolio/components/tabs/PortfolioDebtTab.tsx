// src/features/portfolio/components/tabs/PortfolioDebtTab.tsx
// Debt tab showing mortgage details, amortization, payoff calculator

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Landmark, Plus, Calculator, Calendar, TrendingDown, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { SPACING } from '@/constants/design-tokens';
import { usePortfolioMortgages, formatLoanType } from '../../hooks/usePortfolioMortgages';
import { formatCurrency, formatPercent, formatMonthsAsYearsMonths } from '@/lib/amortization';
import type { PortfolioMortgage } from '../../types';
import { MortgageSheet } from '../MortgageSheet';
import { AmortizationChart } from '../charts/AmortizationChart';

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
      {primaryMortgage ? (
        <Card>
          <CardHeader>
            <View className="flex-row justify-between items-center">
              <CardTitle className="flex-row items-center gap-2">
                <Landmark size={18} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                  Primary Mortgage
                </Text>
              </CardTitle>
              <Badge variant="secondary" size="sm">
                {formatLoanType(primaryMortgage.loan_type)}
              </Badge>
            </View>
          </CardHeader>
          <CardContent>
            <TouchableOpacity onPress={() => handleEditMortgage(primaryMortgage)}>
              {/* Lender */}
              {primaryMortgage.lender_name && (
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: SPACING.sm }}>
                  {primaryMortgage.lender_name}
                </Text>
              )}

              {/* Balance with progress */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>Balance</Text>
                  <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                    {formatCurrency(primaryMortgage.current_balance)}
                  </Text>
                </View>
                <Progress value={payoffProgress} className="h-2" />
                <View className="flex-row justify-between mt-1">
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                    {payoffProgress.toFixed(0)}% paid off
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                    Original: {formatCurrency(primaryMortgage.original_balance)}
                  </Text>
                </View>
              </View>

              {/* Rate and Payment */}
              <View className="flex-row justify-between">
                <View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Rate</Text>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                    {formatPercent(primaryMortgage.interest_rate)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Payment</Text>
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                    {formatCurrency(primaryMortgage.monthly_payment)}/mo
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 items-center">
            <Landmark size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '500', marginTop: SPACING.md }}>
              No Mortgages Added
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Add your mortgage to track principal paydown and calculate payoff scenarios.
            </Text>
            <Button
              variant="default"
              size="sm"
              onPress={handleAddMortgage}
              className="mt-4"
            >
              <Plus size={16} color="white" />
              <Text style={{ color: 'white', marginLeft: 4 }}>Add Mortgage</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* This Month's Payment Breakdown */}
      {primaryMortgage && thisMonthBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Calendar size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                This Month's Payment
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Principal</Text>
                <Text style={{ color: colors.success, fontSize: 18, fontWeight: '600' }}>
                  {formatCurrency(thisMonthBreakdown.principal)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Interest</Text>
                <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '600' }}>
                  {formatCurrency(thisMonthBreakdown.interest)}
                </Text>
              </View>
            </View>

            {/* Visual split */}
            <View className="flex-row mt-4 h-3 rounded-full overflow-hidden">
              <View
                style={{
                  flex: thisMonthBreakdown.principal,
                  backgroundColor: colors.success,
                }}
              />
              <View
                style={{
                  flex: thisMonthBreakdown.interest,
                  backgroundColor: colors.destructive,
                }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text style={{ color: colors.success, fontSize: 11 }}>
                {((thisMonthBreakdown.principal / (thisMonthBreakdown.principal + thisMonthBreakdown.interest)) * 100).toFixed(0)}% to principal
              </Text>
              <Text style={{ color: colors.destructive, fontSize: 11 }}>
                {((thisMonthBreakdown.interest / (thisMonthBreakdown.principal + thisMonthBreakdown.interest)) * 100).toFixed(0)}% to interest
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Amortization Calculator */}
      {primaryMortgage && primaryAmortization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <Calculator size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Amortization
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmortizationChart
              schedule={primaryAmortization}
              onViewFullSchedule={() => setShowFullSchedule(true)}
            />

            {/* Summary Stats */}
            <View className="mt-4 pt-4 border-t gap-2" style={{ borderColor: colors.border }}>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Payoff Date</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                  {new Date(primaryAmortization.summary.payoffDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Remaining Payments</Text>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                  {primaryAmortization.summary.totalPayments} months
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Total Interest</Text>
                <Text style={{ color: colors.destructive, fontSize: 14, fontWeight: '500' }}>
                  {formatCurrency(primaryAmortization.summary.totalInterest)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Payoff Calculator - Extra Payment Scenarios */}
      {primaryMortgage && extraPaymentScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <TrendingDown size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Payoff Calculator
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: SPACING.md }}>
              See how extra payments can accelerate your payoff:
            </Text>

            <View className="gap-3">
              {extraPaymentScenarios.map((scenario) => (
                <View
                  key={scenario.extraMonthlyAmount}
                  className="flex-row justify-between items-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                      +{formatCurrency(scenario.extraMonthlyAmount)}/mo
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      Payoff: {new Date(scenario.newPayoffDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Badge variant="default" size="sm">
                      {formatMonthsAsYearsMonths(scenario.monthsSaved)} sooner
                    </Badge>
                    <Text style={{ color: colors.success, fontSize: 12, marginTop: 2 }}>
                      Save {formatCurrency(scenario.interestSaved)} interest
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Other Loans */}
      {mortgages.length > 1 && (
        <Card>
          <CardHeader>
            <View className="flex-row justify-between items-center">
              <CardTitle className="flex-row items-center gap-2">
                <Landmark size={18} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                  Other Loans
                </Text>
              </CardTitle>
              <TouchableOpacity
                onPress={handleAddMortgage}
                className="flex-row items-center gap-1"
              >
                <Plus size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            <View className="gap-2">
              {mortgages
                .filter((m) => !m.is_primary)
                .map((mortgage) => (
                  <TouchableOpacity
                    key={mortgage.id}
                    onPress={() => handleEditMortgage(mortgage)}
                    className="flex-row justify-between items-center p-3 rounded-lg"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <View>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                        {mortgage.lender_name || formatLoanType(mortgage.loan_type)}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {formatPercent(mortgage.interest_rate)} • {formatCurrency(mortgage.monthly_payment)}/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                        {formatCurrency(mortgage.current_balance)}
                      </Text>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Total Debt Summary */}
      {mortgages.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <View className="flex-row justify-between">
              <View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total Debt</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                  {formatCurrency(totalDebt)}
                </Text>
              </View>
              <View className="items-end">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total Payment</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
                  {formatCurrency(totalMonthlyPayment)}/mo
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
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
