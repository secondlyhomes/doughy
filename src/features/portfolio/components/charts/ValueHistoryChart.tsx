// src/features/portfolio/components/charts/ValueHistoryChart.tsx
// Area chart showing property value over time

import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { PortfolioValuation } from '../../types';

interface ValueHistoryChartProps {
  valuations: PortfolioValuation[];
  acquisitionPrice?: number;
  acquisitionDate?: string;
}

const CHART_HEIGHT = 140;
const CHART_PADDING = 16;

export function ValueHistoryChart({
  valuations,
  acquisitionPrice,
  acquisitionDate,
}: ValueHistoryChartProps) {
  const colors = useThemeColors();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width - 64;

  const chartData = useMemo(() => {
    // Include acquisition as first point if available
    const dataPoints: Array<{ date: string; value: number; source?: string }> = [];

    if (acquisitionPrice && acquisitionDate) {
      dataPoints.push({
        date: acquisitionDate,
        value: acquisitionPrice,
        source: 'Purchase',
      });
    }

    // Add valuations in chronological order (reverse since they come newest first)
    const sortedValuations = [...valuations].reverse();
    sortedValuations.forEach((v) => {
      dataPoints.push({
        date: v.valuation_date,
        value: v.estimated_value,
        source: v.source,
      });
    });

    if (dataPoints.length === 0) {
      return { points: [], maxValue: 0, minValue: 0 };
    }

    // Calculate bounds
    const values = dataPoints.map((p) => p.value);
    const maxValue = Math.max(...values) * 1.1; // 10% padding
    const minValue = Math.min(...values) * 0.9;
    const range = maxValue - minValue || 1;

    // Calculate point positions
    const points = dataPoints.map((point, index) => ({
      ...point,
      x: (index / (dataPoints.length - 1 || 1)) * (screenWidth - CHART_PADDING * 2) + CHART_PADDING,
      y: ((maxValue - point.value) / range) * (CHART_HEIGHT - CHART_PADDING * 2) + CHART_PADDING,
    }));

    return { points, maxValue, minValue };
  }, [valuations, acquisitionPrice, acquisitionDate, screenWidth]);

  const selectedPoint = selectedIndex !== null ? chartData.points[selectedIndex] : null;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  if (chartData.points.length === 0) {
    return (
      <View
        className="items-center justify-center"
        style={{ height: CHART_HEIGHT }}
      >
        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
          No value history available
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
            left: Math.min(Math.max(selectedPoint.x - 50, 0), screenWidth - 100),
            top: -10,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
            {new Date(selectedPoint.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
            {formatCurrency(selectedPoint.value)}
          </Text>
          {selectedPoint.source && (
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
              {selectedPoint.source}
            </Text>
          )}
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

        {/* Area fill (simplified) */}
        <View
          className="absolute"
          style={{
            left: chartData.points[0]?.x || 0,
            right: screenWidth - (chartData.points[chartData.points.length - 1]?.x || screenWidth),
            top: Math.min(...chartData.points.map((p) => p.y)),
            bottom: 0,
            backgroundColor: colors.primary + '20',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        />

        {/* Data points */}
        {chartData.points.map((point, index) => (
          <TouchableOpacity
            key={point.date}
            onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
            className="absolute w-4 h-4 rounded-full items-center justify-center"
            style={{
              left: point.x - 8,
              top: point.y - 8,
              backgroundColor: colors.background,
              borderWidth: 2,
              borderColor: selectedIndex === index ? colors.primary : colors.primary + '80',
              zIndex: 10,
            }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          </TouchableOpacity>
        ))}

        {/* Connecting lines */}
        {chartData.points.length > 1 && chartData.points.slice(0, -1).map((point, index) => {
          const nextPoint = chartData.points[index + 1];
          const dx = nextPoint.x - point.x;
          const dy = nextPoint.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={`line-${index}`}
              className="absolute h-0.5"
              style={{
                backgroundColor: colors.primary,
                width: length,
                left: point.x,
                top: point.y,
                transformOrigin: 'left center',
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
          );
        })}
      </View>

      {/* X-axis labels */}
      <View className="flex-row justify-between mt-2 px-4">
        <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
          {new Date(chartData.points[0]?.date || '').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>
          {new Date(chartData.points[chartData.points.length - 1]?.date || '').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Y-axis labels */}
      <View className="absolute left-0 h-full justify-between py-4">
        <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>
          {formatCurrency(chartData.maxValue)}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>
          {formatCurrency(chartData.minValue)}
        </Text>
      </View>
    </View>
  );
}

export default ValueHistoryChart;
