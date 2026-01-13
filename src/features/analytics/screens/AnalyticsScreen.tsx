// Analytics Screen - React Native
// Zone D: Analytics dashboard with metrics and charts

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Clock,
  Target,
  Calendar,
  ChevronDown,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';

import { LeadsOverTimeChart, LeadSourceChart, ConversionChart } from '../components/LeadsChart';

type DateRange = '7d' | '30d' | '90d' | 'year';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
}

function MetricCard({ title, value, change, icon, suffix }: MetricCardProps) {
  const colors = useThemeColors();
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <View className="bg-card rounded-xl p-4 flex-1 min-w-[45%]">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted-foreground">{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold text-foreground">
        {value}{suffix}
      </Text>
      {change !== undefined && (
        <View className="flex-row items-center mt-1">
          {isPositive ? (
            <TrendingUp size={12} color={colors.success} />
          ) : isNegative ? (
            <TrendingDown size={12} color={colors.destructive} />
          ) : null}
          <Text
            className={`text-xs ml-1 ${
              isPositive
                ? 'text-success'
                : isNegative
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {isPositive ? '+' : ''}{change}% vs last period
          </Text>
        </View>
      )}
    </View>
  );
}

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This year', value: 'year' },
];

export function AnalyticsScreen() {
  const colors = useThemeColors();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock metrics data - will be replaced with real data from Supabase
  const metrics = {
    totalLeads: 156,
    totalLeadsChange: 12.5,
    activeProperties: 24,
    activePropertiesChange: 8.3,
    conversionRate: 24.8,
    conversionRateChange: 2.3,
    avgResponseTime: 2.4,
    avgResponseTimeChange: -18,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getDateRangeLabel = () => {
    const range = DATE_RANGES.find(r => r.value === dateRange);
    return range?.label || 'Last 30 days';
  };

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Analytics</Text>
            <Text className="text-muted-foreground">Track your performance</Text>
          </View>

          {/* Date Range Picker */}
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center bg-muted px-3 py-2 rounded-lg"
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground ml-2">{getDateRangeLabel()}</Text>
              <ChevronDown size={16} color={colors.mutedForeground} className="ml-1" />
            </TouchableOpacity>

            {showDatePicker && (
              <View className="absolute top-12 right-0 bg-card border border-border rounded-lg overflow-hidden shadow-lg z-10 min-w-[160px]">
                {DATE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    className={`px-4 py-3 border-b border-border ${
                      dateRange === range.value ? 'bg-primary/10' : ''
                    }`}
                    onPress={() => {
                      setDateRange(range.value);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text
                      className={`text-sm ${
                        dateRange === range.value
                          ? 'text-primary font-medium'
                          : 'text-foreground'
                      }`}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <MetricCard
            title="Total Leads"
            value={metrics.totalLeads}
            change={metrics.totalLeadsChange}
            icon={<Users size={16} color={colors.info} />}
          />
          <MetricCard
            title="Active Properties"
            value={metrics.activeProperties}
            change={metrics.activePropertiesChange}
            icon={<Building2 size={16} color={colors.info} />}
          />
          <MetricCard
            title="Conversion Rate"
            value={metrics.conversionRate}
            suffix="%"
            change={metrics.conversionRateChange}
            icon={<Target size={16} color={colors.success} />}
          />
          <MetricCard
            title="Avg. Response"
            value={metrics.avgResponseTime}
            suffix="h"
            change={metrics.avgResponseTimeChange}
            icon={<Clock size={16} color={colors.warning} />}
          />
        </View>

        {/* Charts */}
        <View className="gap-4">
          <LeadsOverTimeChart title="Leads This Week" />
          <LeadSourceChart title="Lead Sources" />
          <ConversionChart title="Weekly Conversion Rate" />
        </View>

        {/* Summary Card */}
        <View className="bg-card rounded-xl p-4 mt-4 mb-8">
          <Text className="text-lg font-semibold text-foreground mb-3">Performance Summary</Text>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">New leads this period</Text>
              <Text className="text-foreground font-medium">+{metrics.totalLeads}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Leads converted</Text>
              <Text className="text-foreground font-medium">
                {Math.round(metrics.totalLeads * (metrics.conversionRate / 100))}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Properties added</Text>
              <Text className="text-foreground font-medium">+{metrics.activeProperties}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">AI conversations</Text>
              <Text className="text-foreground font-medium">48</Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default AnalyticsScreen;
