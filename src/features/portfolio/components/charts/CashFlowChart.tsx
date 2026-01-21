// src/features/portfolio/components/charts/CashFlowChart.tsx
// Bar chart showing monthly cash flow

import React, { useMemo } from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface CashFlowDataPoint {
  month: string;
  amount: number;
  rent: number;
  expenses: number;
}

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  showLast?: number;
}

const BAR_WIDTH = 32;
const BAR_GAP = 8;
const CHART_HEIGHT = 120;

export function CashFlowChart({
  data,
  showLast = 12,
}: CashFlowChartProps) {
  const colors = useThemeColors();

  const chartData = useMemo(() => {
    // Take last N months and reverse for chronological order
    const recentData = data.slice(0, showLast).reverse();

    if (recentData.length === 0) {
      return { bars: [], maxValue: 0, minValue: 0 };
    }

    const amounts = recentData.map((d) => d.amount);
    const maxValue = Math.max(...amounts, 0);
    const minValue = Math.min(...amounts, 0);
    const range = maxValue - minValue || 1;

    // Calculate zero line position
    const zeroLineY = (maxValue / range) * CHART_HEIGHT;

    const bars = recentData.map((point, index) => {
      const isPositive = point.amount >= 0;
      const barHeight = Math.abs(point.amount / range) * CHART_HEIGHT;

      return {
        ...point,
        x: index * (BAR_WIDTH + BAR_GAP),
        height: Math.max(barHeight, 2), // Minimum height for visibility
        isPositive,
        y: isPositive ? zeroLineY - barHeight : zeroLineY,
      };
    });

    return { bars, maxValue, minValue, zeroLineY };
  }, [data, showLast]);

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) return `${amount >= 0 ? '+' : '-'}$${(absAmount / 1000).toFixed(0)}K`;
    return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(0)}`;
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3);
  };

  if (chartData.bars.length === 0) {
    return (
      <View
        className="items-center justify-center"
        style={{ height: CHART_HEIGHT }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
          No cash flow data
        </Text>
      </View>
    );
  }

  const chartWidth = chartData.bars.length * (BAR_WIDTH + BAR_GAP);

  return (
    <View>
      {/* Y-axis labels */}
      <View className="flex-row">
        <View className="w-12 justify-between" style={{ height: CHART_HEIGHT }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
            {formatCurrency(chartData.maxValue)}
          </Text>
          {chartData.minValue < 0 && (
            <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
              {formatCurrency(chartData.minValue)}
            </Text>
          )}
        </View>

        {/* Chart area */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <View style={{ height: CHART_HEIGHT, width: chartWidth }}>
            {/* Zero line */}
            <View
              className="absolute w-full h-px"
              style={{
                backgroundColor: colors.border,
                top: chartData.zeroLineY,
              }}
            />

            {/* Bars */}
            {chartData.bars.map((bar, index) => (
              <View
                key={bar.month}
                className="absolute rounded-t-sm"
                style={{
                  left: bar.x,
                  top: bar.y,
                  width: BAR_WIDTH,
                  height: bar.height,
                  backgroundColor: bar.isPositive ? colors.success : colors.destructive,
                  borderBottomLeftRadius: bar.isPositive ? 0 : 4,
                  borderBottomRightRadius: bar.isPositive ? 0 : 4,
                  borderTopLeftRadius: bar.isPositive ? 4 : 0,
                  borderTopRightRadius: bar.isPositive ? 4 : 0,
                }}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* X-axis labels */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 48, paddingRight: 16, marginTop: 4 }}
      >
        <View className="flex-row" style={{ width: chartWidth }}>
          {chartData.bars.map((bar) => (
            <View
              key={bar.month}
              style={{ width: BAR_WIDTH + BAR_GAP }}
              className="items-center"
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
                {formatMonth(bar.month)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default CashFlowChart;
