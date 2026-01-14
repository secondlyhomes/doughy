// src/features/real-estate/components/CashFlowAnalysis.tsx
// Cash flow analysis component for rental properties
// Uses useThemeColors() for reliable dark mode support

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

  const renderMetricRow = (label: string, value: string, isPositive?: boolean, isNegative?: boolean) => (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-sm" style={{ color: colors.mutedForeground }}>{label}</Text>
      <Text
        className="text-sm font-medium"
        style={{
          color: isPositive ? colors.success : isNegative ? colors.destructive : colors.foreground
        }}
      >
        {value}
      </Text>
    </View>
  );

  const renderInput = (
    label: string,
    key: keyof RentalAssumptions,
    placeholder: string,
    prefix?: string
  ) => (
    <View className="mb-3">
      <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>{label}</Text>
      <View
        className="flex-row items-center rounded-lg px-3"
        style={{ backgroundColor: colors.muted }}
      >
        {prefix && <Text className="mr-1" style={{ color: colors.mutedForeground }}>{prefix}</Text>}
        <TextInput
          value={assumptions[key]?.toString() || ''}
          onChangeText={(value) => updateAssumption(key, value)}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          className="flex-1 py-2 text-sm"
          style={{ color: colors.foreground }}
        />
      </View>
    </View>
  );

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Header */}
      <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Home size={18} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Rental Analysis</Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {metrics.hasRentalData ? 'Active' : 'Add Rent'}
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Rent Input - Always Visible */}
      <View className="p-4" style={{ backgroundColor: `${colors.primary}08` }}>
        <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Monthly Rent</Text>
        <View
          className="flex-row items-center rounded-lg px-3"
          style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="mr-1" style={{ color: colors.mutedForeground }}>$</Text>
          <TextInput
            value={assumptions.monthlyRent?.toString() || ''}
            onChangeText={(value) => updateAssumption('monthlyRent', value)}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            className="flex-1 py-3 text-lg font-semibold"
            style={{ color: colors.foreground }}
          />
          <Text style={{ color: colors.mutedForeground }}>/month</Text>
        </View>
      </View>

      {/* Key Metrics */}
      {metrics.hasRentalData && (
        <View className="p-4">
          <View className="flex-row flex-wrap gap-3 mb-4">
            {/* Monthly Cash Flow */}
            <View
              className="flex-1 min-w-[45%] rounded-lg p-3"
              style={{ backgroundColor: colors.muted }}
            >
              <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>Monthly Cash Flow</Text>
              <Text
                className="text-xl font-bold"
                style={{ color: metrics.monthlyCashFlow >= 0 ? colors.success : colors.destructive }}
              >
                {formatCurrency(metrics.monthlyCashFlow)}
              </Text>
            </View>

            {/* Cash on Cash */}
            <View
              className="flex-1 min-w-[45%] rounded-lg p-3"
              style={{ backgroundColor: colors.muted }}
            >
              <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>Cash-on-Cash</Text>
              <Text
                className="text-xl font-bold"
                style={{ color: metrics.cashOnCashReturn >= 0 ? colors.success : colors.destructive }}
              >
                {formatPercentage(metrics.cashOnCashReturn)}
              </Text>
            </View>
          </View>

          {/* Additional Metrics */}
          <View className="flex-row flex-wrap gap-3">
            <View
              className="flex-1 min-w-[30%] rounded-lg p-2"
              style={{ backgroundColor: `${colors.muted}80` }}
            >
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Cap Rate</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                {formatPercentage(metrics.capRate)}
              </Text>
            </View>
            <View
              className="flex-1 min-w-[30%] rounded-lg p-2"
              style={{ backgroundColor: `${colors.muted}80` }}
            >
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>GRM</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                {metrics.grossRentMultiplier.toFixed(1)}x
              </Text>
            </View>
            <View
              className="flex-1 min-w-[30%] rounded-lg p-2"
              style={{ backgroundColor: `${colors.muted}80` }}
            >
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Annual</Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: metrics.annualCashFlow >= 0 ? colors.success : colors.destructive }}
              >
                {formatCurrency(metrics.annualCashFlow)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Breakdown Section */}
      {metrics.hasRentalData && (
        <View className="px-4 pb-4">
          <View className="pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {/* Income */}
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Income</Text>
            {renderMetricRow('Gross Rent', formatCurrency(metrics.monthlyRent), true)}

            {/* Expenses */}
            <Text className="text-sm font-medium mt-3 mb-2" style={{ color: colors.foreground }}>Expenses</Text>
            {renderMetricRow('Operating Expenses', `-${formatCurrency(metrics.monthlyExpenses)}`, false, true)}
            {renderMetricRow('Mortgage (P&I)', `-${formatCurrency(metrics.monthlyMortgage)}`, false, true)}

            {/* Net */}
            <View className="h-px my-2" style={{ backgroundColor: colors.border }} />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>Net Cash Flow</Text>
              <Text
                className="text-base font-bold"
                style={{ color: metrics.monthlyCashFlow >= 0 ? colors.success : colors.destructive }}
              >
                {formatCurrency(metrics.monthlyCashFlow)}/mo
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Expandable Assumptions */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between px-4 py-3"
        style={{ backgroundColor: `${colors.muted}80`, borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <View className="flex-row items-center">
          <Calculator size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>Assumptions</Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={16} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View className="p-4" style={{ backgroundColor: `${colors.muted}50` }}>
          {/* Expense Assumptions */}
          <Text className="text-sm font-medium mb-3" style={{ color: colors.foreground }}>Expense Rates</Text>
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
          <Text className="text-sm font-medium mb-3" style={{ color: colors.foreground }}>Fixed Expenses</Text>
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
          <Text className="text-sm font-medium mb-3 mt-4" style={{ color: colors.foreground }}>Loan Details</Text>
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
          <View
            className="flex-row rounded-lg p-3 mt-2"
            style={{ backgroundColor: `${colors.primary}08` }}
          >
            <Info size={14} color={colors.primary} className="mt-0.5" />
            <Text className="text-xs ml-2 flex-1" style={{ color: colors.mutedForeground }}>
              Adjust assumptions to match your specific situation. Default values are estimates based on typical market conditions.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
