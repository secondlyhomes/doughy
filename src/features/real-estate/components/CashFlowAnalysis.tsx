// src/features/real-estate/components/CashFlowAnalysis.tsx
// Cash flow analysis component for rental properties

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import {
  Home,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Property } from '../types';
import { useDealAnalysis, RentalAssumptions, DEFAULT_RENTAL_ASSUMPTIONS } from '../hooks/useDealAnalysis';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface CashFlowAnalysisProps {
  property: Property;
}

export function CashFlowAnalysis({ property }: CashFlowAnalysisProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [assumptions, setAssumptions] = useState<RentalAssumptions>(() => ({
    ...DEFAULT_RENTAL_ASSUMPTIONS,
    loanAmount: (property.purchase_price || 0) * 0.8, // Default 80% LTV
    propertyTaxAnnual: (property.purchase_price || 0) * 0.012, // ~1.2% of value
  }));

  const metrics = useDealAnalysis(property, assumptions);

  const updateAssumption = useCallback((key: keyof RentalAssumptions, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAssumptions(prev => ({ ...prev, [key]: numValue }));
  }, []);

  const renderMetricRow = (label: string, value: string, valueColor?: string) => (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className={`text-sm font-medium ${valueColor || 'text-foreground'}`}>{value}</Text>
    </View>
  );

  const renderInput = (
    label: string,
    key: keyof RentalAssumptions,
    placeholder: string,
    prefix?: string
  ) => (
    <View className="mb-3">
      <Text className="text-xs text-muted-foreground mb-1">{label}</Text>
      <View className="flex-row items-center bg-muted rounded-lg px-3">
        {prefix && <Text className="text-muted-foreground mr-1">{prefix}</Text>}
        <TextInput
          value={assumptions[key]?.toString() || ''}
          onChangeText={(value) => updateAssumption(key, value)}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          className="flex-1 py-2 text-foreground text-sm"
        />
      </View>
    </View>
  );

  return (
    <View className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <View className="p-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Home size={18} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Rental Analysis</Text>
          </View>
          <View className="bg-primary/10 px-2 py-1 rounded-full">
            <Text className="text-xs font-medium text-primary">
              {metrics.hasRentalData ? 'Active' : 'Add Rent'}
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Rent Input - Always Visible */}
      <View className="p-4 bg-primary/5">
        <Text className="text-xs text-muted-foreground mb-1">Monthly Rent</Text>
        <View className="flex-row items-center bg-background rounded-lg px-3 border border-border">
          <Text className="text-muted-foreground mr-1">$</Text>
          <TextInput
            value={assumptions.monthlyRent?.toString() || ''}
            onChangeText={(value) => updateAssumption('monthlyRent', value)}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3 text-lg font-semibold text-foreground"
          />
          <Text className="text-muted-foreground">/month</Text>
        </View>
      </View>

      {/* Key Metrics */}
      {metrics.hasRentalData && (
        <View className="p-4">
          <View className="flex-row flex-wrap gap-3 mb-4">
            {/* Monthly Cash Flow */}
            <View className="flex-1 min-w-[45%] bg-muted rounded-lg p-3">
              <Text className="text-xs text-muted-foreground uppercase">Monthly Cash Flow</Text>
              <Text className={`text-xl font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(metrics.monthlyCashFlow)}
              </Text>
            </View>

            {/* Cash on Cash */}
            <View className="flex-1 min-w-[45%] bg-muted rounded-lg p-3">
              <Text className="text-xs text-muted-foreground uppercase">Cash-on-Cash</Text>
              <Text className={`text-xl font-bold ${metrics.cashOnCashReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(metrics.cashOnCashReturn)}
              </Text>
            </View>
          </View>

          {/* Additional Metrics */}
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[30%] bg-muted/50 rounded-lg p-2">
              <Text className="text-xs text-muted-foreground">Cap Rate</Text>
              <Text className="text-sm font-semibold text-foreground">
                {formatPercentage(metrics.capRate)}
              </Text>
            </View>
            <View className="flex-1 min-w-[30%] bg-muted/50 rounded-lg p-2">
              <Text className="text-xs text-muted-foreground">GRM</Text>
              <Text className="text-sm font-semibold text-foreground">
                {metrics.grossRentMultiplier.toFixed(1)}x
              </Text>
            </View>
            <View className="flex-1 min-w-[30%] bg-muted/50 rounded-lg p-2">
              <Text className="text-xs text-muted-foreground">Annual</Text>
              <Text className={`text-sm font-semibold ${metrics.annualCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(metrics.annualCashFlow)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Breakdown Section */}
      {metrics.hasRentalData && (
        <View className="px-4 pb-4">
          <View className="border-t border-border pt-4">
            {/* Income */}
            <Text className="text-sm font-medium text-foreground mb-2">Income</Text>
            {renderMetricRow('Gross Rent', formatCurrency(metrics.monthlyRent), 'text-success')}

            {/* Expenses */}
            <Text className="text-sm font-medium text-foreground mt-3 mb-2">Expenses</Text>
            {renderMetricRow('Operating Expenses', `-${formatCurrency(metrics.monthlyExpenses)}`, 'text-destructive')}
            {renderMetricRow('Mortgage (P&I)', `-${formatCurrency(metrics.monthlyMortgage)}`, 'text-destructive')}

            {/* Net */}
            <View className="h-px bg-border my-2" />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-sm font-semibold text-foreground">Net Cash Flow</Text>
              <Text className={`text-base font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(metrics.monthlyCashFlow)}/mo
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Expandable Assumptions */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between px-4 py-3 bg-muted/50 border-t border-border"
      >
        <View className="flex-row items-center">
          <Calculator size={14} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground ml-2">Assumptions</Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </TouchableOpacity>

      {expanded && (
        <View className="p-4 bg-muted/30">
          {/* Expense Assumptions */}
          <Text className="text-sm font-medium text-foreground mb-3">Expense Rates</Text>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderInput('Vacancy %', 'vacancyRate', '8')}
            </View>
            <View className="flex-1">
              {renderInput('Mgmt %', 'managementFee', '10')}
            </View>
            <View className="flex-1">
              {renderInput('Maint %', 'maintenanceRate', '5')}
            </View>
          </View>

          {/* Fixed Expenses */}
          <Text className="text-sm font-medium text-foreground mb-3">Fixed Expenses</Text>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderInput('Insurance/yr', 'insuranceAnnual', '1200', '$')}
            </View>
            <View className="flex-1">
              {renderInput('Tax/yr', 'propertyTaxAnnual', '3000', '$')}
            </View>
          </View>

          {renderInput('HOA/month', 'hoaMonthly', '0', '$')}

          {/* Loan Assumptions */}
          <Text className="text-sm font-medium text-foreground mb-3 mt-4">Loan Details</Text>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              {renderInput('Loan Amount', 'loanAmount', '0', '$')}
            </View>
            <View className="flex-1">
              {renderInput('Rate %', 'interestRate', '7')}
            </View>
            <View className="w-20">
              {renderInput('Years', 'loanTermYears', '30')}
            </View>
          </View>

          {/* Info */}
          <View className="flex-row bg-primary/5 rounded-lg p-3 mt-2">
            <Info size={14} className="text-primary mt-0.5" />
            <Text className="text-xs text-muted-foreground ml-2 flex-1">
              Adjust assumptions to match your specific situation. Default values are estimates based on typical market conditions.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
