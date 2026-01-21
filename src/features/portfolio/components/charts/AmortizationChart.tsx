// src/features/portfolio/components/charts/AmortizationChart.tsx
// Visual representation of amortization schedule

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import type { AmortizationSchedule } from '../../types';

interface AmortizationChartProps {
  schedule: AmortizationSchedule;
  onViewFullSchedule?: () => void;
}

const CHART_HEIGHT = 100;

export function AmortizationChart({
  schedule,
  onViewFullSchedule,
}: AmortizationChartProps) {
  const colors = useThemeColors();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width - 64;

  // Aggregate by year for visualization
  const yearlyData = useMemo(() => {
    const years = new Map<number, { principal: number; interest: number; balance: number }>();

    schedule.entries.forEach((entry) => {
      const year = new Date(entry.date).getFullYear();
      const existing = years.get(year) || { principal: 0, interest: 0, balance: entry.balance };
      years.set(year, {
        principal: existing.principal + entry.principal,
        interest: existing.interest + entry.interest,
        balance: entry.balance,
      });
    });

    return Array.from(years.entries())
      .map(([year, data]) => ({ year, ...data }))
      .slice(0, 10); // Show first 10 years
  }, [schedule.entries]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const selectedYearData = selectedYear !== null
    ? yearlyData.find((y) => y.year === selectedYear)
    : null;

  if (yearlyData.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <Text style={{ color: colors.mutedForeground }}>No amortization data</Text>
      </View>
    );
  }

  const maxValue = Math.max(...yearlyData.map((y) => y.principal + y.interest));

  return (
    <View>
      {/* Selected year info */}
      {selectedYearData && (
        <View
          className="mb-3 p-3 rounded-lg"
          style={{ backgroundColor: colors.muted }}
        >
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
            Year {selectedYearData.year}
          </Text>
          <View className="flex-row justify-between mt-2">
            <View>
              <Text style={{ color: colors.success, fontSize: 12 }}>Principal</Text>
              <Text style={{ color: colors.success, fontSize: 15, fontWeight: '600' }}>
                {formatCurrency(selectedYearData.principal)}
              </Text>
            </View>
            <View className="items-center">
              <Text style={{ color: colors.destructive, fontSize: 12 }}>Interest</Text>
              <Text style={{ color: colors.destructive, fontSize: 15, fontWeight: '600' }}>
                {formatCurrency(selectedYearData.interest)}
              </Text>
            </View>
            <View className="items-end">
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Balance</Text>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                {formatCurrency(selectedYearData.balance)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Stacked bar chart */}
      <View style={{ height: CHART_HEIGHT }} className="flex-row items-end justify-between">
        {yearlyData.map((year) => {
          const total = year.principal + year.interest;
          const heightRatio = total / maxValue;
          const principalRatio = year.principal / total;
          const isSelected = selectedYear === year.year;

          return (
            <TouchableOpacity
              key={year.year}
              onPress={() => setSelectedYear(isSelected ? null : year.year)}
              style={{
                width: (screenWidth / yearlyData.length) - 4,
                height: CHART_HEIGHT * heightRatio,
                opacity: selectedYear !== null && !isSelected ? 0.5 : 1,
              }}
              className="rounded-t overflow-hidden"
            >
              {/* Interest portion (bottom) */}
              <View
                style={{
                  flex: 1 - principalRatio,
                  backgroundColor: colors.destructive,
                }}
              />
              {/* Principal portion (top) */}
              <View
                style={{
                  flex: principalRatio,
                  backgroundColor: colors.success,
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Year labels */}
      <View className="flex-row justify-between mt-2">
        {yearlyData.map((year) => (
          <Text
            key={year.year}
            style={{
              color: selectedYear === year.year ? colors.foreground : colors.mutedForeground,
              fontSize: 10,
              width: (screenWidth / yearlyData.length) - 4,
              textAlign: 'center',
              fontWeight: selectedYear === year.year ? '600' : '400',
            }}
          >
            {year.year.toString().slice(-2)}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center gap-6 mt-4">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded" style={{ backgroundColor: colors.success }} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Principal</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded" style={{ backgroundColor: colors.destructive }} />
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Interest</Text>
        </View>
      </View>

      {/* View full schedule link */}
      {onViewFullSchedule && (
        <TouchableOpacity
          onPress={onViewFullSchedule}
          className="flex-row items-center justify-center mt-4"
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
            View Full Schedule
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default AmortizationChart;
