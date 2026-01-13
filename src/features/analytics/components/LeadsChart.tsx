// Leads Chart Component - React Native
// Displays lead analytics using react-native-chart-kit

import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

// Helper to convert hex to rgba
const hexToRgba = (hex: string, opacity: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
  }
  return `rgba(0, 0, 0, ${opacity})`;
};

interface LeadsOverTimeChartProps {
  data?: { label: string; value: number }[];
  title?: string;
}

export function LeadsOverTimeChart({
  data,
  title = 'Leads Over Time'
}: LeadsOverTimeChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useThemeColors();

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.info, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.mutedForeground, opacity),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.info,
    },
  };

  // Default mock data
  const chartData = data || [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 19 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 25 },
    { label: 'Fri', value: 22 },
    { label: 'Sat', value: 8 },
    { label: 'Sun', value: 5 },
  ];

  const lineData = {
    labels: chartData.map(d => d.label),
    datasets: [
      {
        data: chartData.map(d => d.value),
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View className="bg-card rounded-xl p-4">
      <View className="flex-row items-center mb-4">
        <TrendingUp size={20} color={colors.info} />
        <Text className="text-lg font-semibold text-foreground ml-2">{title}</Text>
      </View>
      <LineChart
        data={lineData}
        width={screenWidth - 64}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
}

interface LeadSourceChartProps {
  data?: { name: string; count: number; color: string }[];
  title?: string;
}

export function LeadSourceChart({
  data,
  title = 'Lead Sources'
}: LeadSourceChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useThemeColors();

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.info, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.mutedForeground, opacity),
    style: {
      borderRadius: 16,
    },
  };

  // Default mock data
  const pieData = data || [
    {
      name: 'Website',
      count: 45,
      color: colors.info,
      legendFontColor: colors.mutedForeground,
      legendFontSize: 12,
    },
    {
      name: 'Referral',
      count: 28,
      color: colors.success,
      legendFontColor: colors.mutedForeground,
      legendFontSize: 12,
    },
    {
      name: 'Social',
      count: 15,
      color: colors.warning,
      legendFontColor: colors.mutedForeground,
      legendFontSize: 12,
    },
    {
      name: 'Cold Call',
      count: 12,
      color: colors.primary,
      legendFontColor: colors.mutedForeground,
      legendFontSize: 12,
    },
  ];

  const formattedData = pieData.map(item => ({
    name: item.name,
    population: item.count,
    color: item.color,
    legendFontColor: colors.mutedForeground,
    legendFontSize: 12,
  }));

  return (
    <View className="bg-card rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-4">{title}</Text>
      <PieChart
        data={formattedData}
        width={screenWidth - 64}
        height={180}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

interface ConversionChartProps {
  data?: { label: string; converted: number; total: number }[];
  title?: string;
}

export function ConversionChart({
  data,
  title = 'Conversion Rate'
}: ConversionChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useThemeColors();

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.success, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.mutedForeground, opacity),
    style: {
      borderRadius: 16,
    },
  };

  // Default mock data
  const chartData = data || [
    { label: 'Week 1', converted: 8, total: 32 },
    { label: 'Week 2', converted: 12, total: 40 },
    { label: 'Week 3', converted: 15, total: 45 },
    { label: 'Week 4', converted: 18, total: 50 },
  ];

  const barData = {
    labels: chartData.map(d => d.label),
    datasets: [
      {
        data: chartData.map(d => d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0),
      },
    ],
  };

  return (
    <View className="bg-card rounded-xl p-4">
      <Text className="text-lg font-semibold text-foreground mb-4">{title}</Text>
      <BarChart
        data={barData}
        width={screenWidth - 64}
        height={200}
        yAxisLabel=""
        yAxisSuffix="%"
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        showValuesOnTopOfBars
      />
    </View>
  );
}

export default LeadsOverTimeChart;
