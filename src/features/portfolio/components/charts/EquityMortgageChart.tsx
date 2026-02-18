// src/features/portfolio/components/charts/EquityMortgageChart.tsx
// Interactive equity vs mortgage chart using View-based visualization

import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface EquityHistoryPoint {
  date: string;
  equity: number;
  mortgage: number;
  value: number;
}

interface EquityMortgageChartProps {
  equityHistory: EquityHistoryPoint[];
  currentEquity: number;
  currentMortgage: number;
}

const CHART_HEIGHT = 180;
const CHART_PADDING = 20;

export function EquityMortgageChart({
  equityHistory,
  currentEquity,
  currentMortgage,
}: EquityMortgageChartProps) {
  const colors = useThemeColors();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width - 64; // Account for padding

  const chartData = useMemo(() => {
    if (equityHistory.length === 0) {
      return { points: [], maxValue: 0, minValue: 0 };
    }

    // Get max value for scaling
    const allValues = equityHistory.flatMap((p) => [p.equity, p.mortgage, p.value]);
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues.filter((v) => v > 0), 0);

    // Calculate points
    const points = equityHistory.map((point, index) => {
      const x = (index / (equityHistory.length - 1 || 1)) * (screenWidth - CHART_PADDING * 2);
      const equityY = ((maxValue - point.equity) / (maxValue - minValue)) * (CHART_HEIGHT - CHART_PADDING * 2);
      const mortgageY = ((maxValue - point.mortgage) / (maxValue - minValue)) * (CHART_HEIGHT - CHART_PADDING * 2);

      return {
        ...point,
        x: x + CHART_PADDING,
        equityY: equityY + CHART_PADDING,
        mortgageY: mortgageY + CHART_PADDING,
      };
    });

    return { points, maxValue, minValue };
  }, [equityHistory, screenWidth]);

  const selectedPoint = selectedIndex !== null ? chartData.points[selectedIndex] : null;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  if (equityHistory.length === 0) {
    return (
      <View
        className="items-center justify-center"
        style={{ height: CHART_HEIGHT }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
          Not enough data for chart
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
          Add more valuations to see trends
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Selected point tooltip */}
      {selectedPoint && (
        <View
          className="absolute z-10 p-2 rounded-lg"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            left: Math.min(Math.max(selectedPoint.x - 60, 0), screenWidth - 120),
            top: -10,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
            {new Date(selectedPoint.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
          <Text style={{ color: colors.success, fontSize: 13, fontWeight: '500' }}>
            Equity: {formatCurrency(selectedPoint.equity)}
          </Text>
          <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: '500' }}>
            Mortgage: {formatCurrency(selectedPoint.mortgage)}
          </Text>
        </View>
      )}

      {/* Chart area */}
      <View style={{ height: CHART_HEIGHT, width: screenWidth }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <View
            key={ratio}
            className="absolute w-full border-b border-dashed"
            style={{
              top: CHART_HEIGHT * ratio,
              borderColor: colors.border,
              opacity: 0.3,
            }}
          />
        ))}

        {/* Equity area */}
        <View
          className="absolute"
          style={{
            left: CHART_PADDING,
            right: CHART_PADDING,
            top: CHART_PADDING,
            bottom: CHART_PADDING,
          }}
        >
          {/* Draw equity line using absolute positioned dots and connecting lines */}
          {chartData.points.map((point, index) => (
            <React.Fragment key={`equity-${index}`}>
              {/* Equity dot */}
              <TouchableOpacity
                onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: colors.success,
                  left: point.x - 6,
                  top: point.equityY - 6,
                  zIndex: 10,
                }}
              />
              {/* Mortgage dot */}
              <TouchableOpacity
                onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: colors.destructive,
                  left: point.x - 6,
                  top: point.mortgageY - 6,
                  zIndex: 10,
                }}
              />
            </React.Fragment>
          ))}

          {/* Simple line visualization using View-based approach */}
          {chartData.points.length > 1 && (
            <View className="absolute inset-0">
              {/* Equity trend line indicator */}
              <View
                className="absolute h-0.5 origin-left"
                style={{
                  backgroundColor: colors.success,
                  width: screenWidth - CHART_PADDING * 2,
                  top: chartData.points[chartData.points.length - 1].equityY,
                  opacity: 0.3,
                }}
              />
              {/* Mortgage trend line indicator */}
              <View
                className="absolute h-0.5 origin-left"
                style={{
                  backgroundColor: colors.destructive,
                  width: screenWidth - CHART_PADDING * 2,
                  top: chartData.points[chartData.points.length - 1].mortgageY,
                  opacity: 0.3,
                }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row justify-center gap-6 mt-2">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Equity</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.destructive }} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Mortgage</Text>
        </View>
      </View>
    </View>
  );
}

export default EquityMortgageChart;
