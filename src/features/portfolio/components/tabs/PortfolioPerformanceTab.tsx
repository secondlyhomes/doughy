// src/features/portfolio/components/tabs/PortfolioPerformanceTab.tsx
// Performance tab showing equity/mortgage chart, ROI, projections, benchmarks

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Target, PiggyBank, BarChart3 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPACING } from '@/constants/design-tokens';
import type { PortfolioPropertyPerformance, PortfolioBenchmark } from '../../types';
import { EquityMortgageChart } from '../charts/EquityMortgageChart';
import { CashFlowChart } from '../charts/CashFlowChart';

interface PortfolioPerformanceTabProps {
  portfolioEntryId?: string;
  performance?: PortfolioPropertyPerformance | null;
  benchmark?: PortfolioBenchmark;
}

export function PortfolioPerformanceTab({
  portfolioEntryId,
  performance,
  benchmark,
}: PortfolioPerformanceTabProps) {
  const colors = useThemeColors();

  if (!performance) {
    return (
      <View className="py-8 items-center">
        <Text style={{ color: colors.mutedForeground }}>
          No performance data available yet.
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
          Add monthly records to track performance.
        </Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View className="py-4 gap-4 pb-6">
      {/* Equity vs Mortgage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <TrendingUp size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Equity vs Mortgage
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EquityMortgageChart
            equityHistory={performance.equity_history}
            currentEquity={performance.current_equity}
            currentMortgage={performance.current_mortgage_balance}
          />

          {/* Current Values */}
          <View className="flex-row justify-around mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
            <View className="items-center">
              <Text style={{ color: colors.success, fontSize: 11, fontWeight: '500' }}>Current Equity</Text>
              <Text style={{ color: colors.success, fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                {formatCurrency(performance.current_equity)}
              </Text>
            </View>
            <View className="items-center">
              <Text style={{ color: colors.destructive, fontSize: 11, fontWeight: '500' }}>Mortgage Balance</Text>
              <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '700', marginTop: 2 }}>
                {formatCurrency(performance.current_mortgage_balance)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Returns Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Target size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Returns
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-3">
            <ReturnRow
              label="Cash-on-Cash Return"
              value={`${performance.cash_on_cash_return.toFixed(1)}%`}
              description="Annual cash flow / cash invested"
              isGood={performance.cash_on_cash_return >= 8}
              colors={colors}
            />
            <ReturnRow
              label="Total ROI"
              value={`${performance.total_roi.toFixed(1)}%`}
              description="All returns / cash invested"
              isGood={performance.total_roi >= 0}
              colors={colors}
            />
            <ReturnRow
              label="Cap Rate"
              value={`${performance.cap_rate.toFixed(1)}%`}
              description="NOI / property value"
              isGood={performance.cap_rate >= 5}
              colors={colors}
            />
            <ReturnRow
              label="Annualized Return"
              value={`${performance.annualized_return.toFixed(1)}%`}
              description="Compound annual growth rate"
              isGood={performance.annualized_return >= 10}
              colors={colors}
            />
          </View>
        </CardContent>
      </Card>

      {/* Cash Flow Trend */}
      {performance.cash_flow_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <PiggyBank size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Cash Flow Trend
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={performance.cash_flow_history} />

            <View className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                  Average Monthly
                </Text>
                <Text
                  style={{
                    color: performance.average_monthly_cash_flow >= 0 ? colors.success : colors.destructive,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {performance.average_monthly_cash_flow >= 0 ? '+' : ''}
                  {formatCurrency(performance.average_monthly_cash_flow)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <BarChart3 size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Equity Projections
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-3">
            <ProjectionRow
              label="5-Year Equity"
              value={formatCurrency(performance.projected_equity_5yr)}
              subValue={formatCurrency(performance.projected_value_5yr)}
              colors={colors}
            />
            <ProjectionRow
              label="10-Year Equity"
              value={formatCurrency(performance.projected_equity_10yr)}
              subValue={formatCurrency(performance.projected_value_10yr)}
              colors={colors}
            />
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: SPACING.md, fontStyle: 'italic' }}>
            Based on 3% annual appreciation and current mortgage terms
          </Text>
        </CardContent>
      </Card>

      {/* Benchmarks */}
      {benchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <TrendingUp size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Benchmarks
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <BenchmarkRow
                label="vs S&P 500"
                propertyValue={performance.annualized_return}
                benchmarkValue={benchmark.sp500_annual_return}
                unit="%"
                colors={colors}
              />
              {benchmark.portfolio_average_cash_flow > 0 && benchmark.portfolio_average_cash_flow !== performance.average_monthly_cash_flow && (
                <BenchmarkRow
                  label="vs Portfolio Avg"
                  propertyValue={performance.average_monthly_cash_flow}
                  benchmarkValue={benchmark.portfolio_average_cash_flow}
                  unit="/mo"
                  isCurrency
                  colors={colors}
                />
              )}
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  );
}

// Return row component
function ReturnRow({
  label,
  value,
  description,
  isGood,
  colors,
}: {
  label: string;
  value: string;
  description: string;
  isGood: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{description}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text
          style={{
            color: isGood ? colors.success : colors.foreground,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
        {isGood ? (
          <TrendingUp size={16} color={colors.success} />
        ) : (
          <TrendingDown size={16} color={colors.mutedForeground} />
        )}
      </View>
    </View>
  );
}

// Projection row component
function ProjectionRow({
  label,
  value,
  subValue,
  colors,
}: {
  label: string;
  value: string;
  subValue: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      <View className="items-end">
        <Text style={{ color: colors.success, fontSize: 16, fontWeight: '600' }}>{value}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          ({subValue} value)
        </Text>
      </View>
    </View>
  );
}

// Benchmark row component
function BenchmarkRow({
  label,
  propertyValue,
  benchmarkValue,
  unit,
  isCurrency,
  colors,
}: {
  label: string;
  propertyValue: number;
  benchmarkValue: number;
  unit: string;
  isCurrency?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const diff = propertyValue - benchmarkValue;
  const isPositive = diff >= 0;

  const formatValue = (val: number) => {
    if (isCurrency) {
      return `$${Math.abs(val).toFixed(0)}`;
    }
    return `${Math.abs(val).toFixed(1)}`;
  };

  return (
    <View className="flex-row justify-between items-center">
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      <Badge
        variant={isPositive ? 'default' : 'destructive'}
        size="sm"
      >
        {`${isPositive ? '+' : '-'}${formatValue(diff)}${unit}${isPositive ? ' better' : ' behind'}`}
      </Badge>
    </View>
  );
}

export default PortfolioPerformanceTab;
