// Leads Chart Component - React Native
// Displays lead analytics using react-native-chart-kit

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#3b82f6',
  },
};

interface LeadsOverTimeChartProps {
  data?: { label: string; value: number }[];
  title?: string;
}

export function LeadsOverTimeChart({
  data,
  title = 'Leads Over Time'
}: LeadsOverTimeChartProps) {
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
        <TrendingUp size={20} color="#3b82f6" />
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
  // Default mock data
  const pieData = data || [
    {
      name: 'Website',
      count: 45,
      color: '#3b82f6',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
    {
      name: 'Referral',
      count: 28,
      color: '#22c55e',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
    {
      name: 'Social',
      count: 15,
      color: '#f59e0b',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
    {
      name: 'Cold Call',
      count: 12,
      color: '#8b5cf6',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
  ];

  const formattedData = pieData.map(item => ({
    name: item.name,
    population: item.count,
    color: item.color,
    legendFontColor: '#6b7280',
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
        data: chartData.map(d => Math.round((d.converted / d.total) * 100)),
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
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        }}
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
