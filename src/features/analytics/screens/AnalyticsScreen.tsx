// Analytics Screen - React Native
// Zone D: Analytics dashboard with metrics and charts
// Uses useThemeColors() for reliable dark mode support

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
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

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
    <View
      className="rounded-xl p-4 flex-1 min-w-[45%]"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
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
            className="text-xs ml-1"
            style={{
              color: isPositive
                ? colors.success
                : isNegative
                ? colors.destructive
                : colors.mutedForeground
            }}
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
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>Analytics</Text>
            <Text style={{ color: colors.mutedForeground }}>Track your performance</Text>
          </View>

          {/* Date Range Picker */}
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.muted }}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar size={16} color={colors.mutedForeground} />
              <Text className="text-sm ml-2" style={{ color: colors.foreground }}>{getDateRangeLabel()}</Text>
              <ChevronDown size={16} color={colors.mutedForeground} className="ml-1" />
            </TouchableOpacity>

            {showDatePicker && (
              <View
                className="absolute top-12 right-0 rounded-lg overflow-hidden shadow-lg z-10 min-w-[160px]"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                {DATE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    className="px-4 py-3"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: dateRange === range.value ? withOpacity(colors.primary, 'muted') : undefined,
                    }}
                    onPress={() => {
                      setDateRange(range.value);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: dateRange === range.value ? colors.primary : colors.foreground,
                        fontWeight: dateRange === range.value ? '500' : '400',
                      }}
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
        <View
          className="rounded-xl p-4 mt-4 mb-8"
          style={{ backgroundColor: colors.card }}
        >
          <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Performance Summary</Text>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.mutedForeground }}>New leads this period</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>+{metrics.totalLeads}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.mutedForeground }}>Leads converted</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {Math.round(metrics.totalLeads * (metrics.conversionRate / 100))}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.mutedForeground }}>Properties added</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>+{metrics.activeProperties}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.mutedForeground }}>AI conversations</Text>
              <Text className="font-medium" style={{ color: colors.foreground }}>48</Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default AnalyticsScreen;
